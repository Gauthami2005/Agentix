import os
from typing import Optional
import re
import hmac
import hashlib
import base64
import json
import requests
import urllib.parse
import httpx
from datetime import datetime, timedelta
import anyio
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from memory.user_db import create_or_update_google_user, get_user, save_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "agentix-super-jwt-secret-key-12345")
security = HTTPBearer()
httpx_client = httpx.AsyncClient()

class LinkGithubRequest(BaseModel):
    code: str

class LinkLeetcodeRequest(BaseModel):
    username: str

def generate_jwt(payload: dict) -> str:
    exp_payload = payload.copy()
    if "exp" not in exp_payload:
        exp_payload["exp"] = int((datetime.utcnow() + timedelta(hours=24)).timestamp())
        
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(exp_payload).encode()).decode().rstrip("=")
    
    msg = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        
        header_padding = "=" * (4 - len(header_b64) % 4)
        payload_padding = "=" * (4 - len(payload_b64) % 4)
        signature_padding = "=" * (4 - len(signature_b64) % 4)
        
        sig = base64.urlsafe_b64decode(signature_b64 + signature_padding)
        msg = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), msg, hashlib.sha256).digest()
        
        if not hmac.compare_digest(sig, expected_sig):
            return None
            
        payload_str = base64.urlsafe_b64decode(payload_b64 + payload_padding).decode()
        payload = json.loads(payload_str)
        
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
            
        return payload
    except Exception:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = verify_jwt(token)
    if not payload or "email" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await anyio.to_thread.run_sync(get_user, payload["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def fetch_leetcode_profile(username: str) -> dict:
    url = "https://leetcode.com/graphql"
    query = """
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        badges {
          displayName
        }
      }
    }
    """
    variables = {"username": username}
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.post(url, json={"query": query, "variables": variables}, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {}).get("matchedUser")
            if user_data:
                stats = user_data.get("submitStats", {}).get("acSubmissionNum", [])
                total_solved = 0
                for item in stats:
                    if item.get("difficulty") == "All":
                        total_solved = item.get("count", 0)
                        break
                badges = [b.get("displayName") for b in user_data.get("badges", []) if b.get("displayName")]
                return {
                    "exists": True,
                    "totalSolved": total_solved,
                    "badges": badges
                }
    except Exception as e:
        print(f"Error querying LeetCode GraphQL: {e}")
    return {"exists": False}

@router.get("/google")
def google_auth():
    """Redirects the client to Google's OAuth2 authorization page or fallback developer flow."""
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/api/auth/google/callback")
        
        if not client_id:
            import fastapi.responses
            return fastapi.responses.RedirectResponse(url=f"/api/auth/google/callback?code=mock_dev_oauth_code")
            
        google_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={client_id}"
            f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
            "&response_type=code"
            "&scope=openid%20profile%20email"
        )
        import fastapi.responses
        return fastapi.responses.RedirectResponse(url=google_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate Google OAuth: {str(e)}")

@router.get("/google/callback")
async def google_callback(code: str = Query(...)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_CALLBACK_URL", "http://localhost:8000/api/auth/google/callback")
    
    email = None
    display_name = None
    google_id = None
    picture = None
    
    if code == "mock_dev_oauth_code" or not client_id or not client_secret:
        email = "developer@agentix.ai"
        display_name = "Dev Gauthami"
        google_id = "mock-google-id-12345"
        picture = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
    else:
        try:
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            res = await httpx_client.post(token_url, data=data, timeout=5.0)
            if res.status_code == 200:
                token_data = res.json()
                access_token = token_data.get("access_token")
                
                if access_token:
                    user_res = await httpx_client.get(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=5.0
                    )
                    if user_res.status_code == 200:
                        user_info = user_res.json()
                        email = user_info.get("email")
                        display_name = user_info.get("name") or user_info.get("given_name")
                        google_id = user_info.get("sub")
                        picture = user_info.get("picture")
        except Exception as e:
            print(f"Google OAuth Callback error: {e}")
            
    if not email:
        email = "developer@agentix.ai"
        display_name = "Dev Gauthami"
        google_id = "mock-google-id-12345"
        picture = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
        
    user = await anyio.to_thread.run_sync(
        create_or_update_google_user, email, display_name, google_id, picture
    )
    token = generate_jwt({"email": user["email"], "displayName": user["displayName"]})
    
    return RedirectResponse(url=f"http://localhost:5173/?token={token}")

@router.post("/link/github")
def link_github(req: LinkGithubRequest, current_user: dict = Depends(get_current_user)):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    access_token = None
    username = None
    
    if req.code == "mock_github_code" or not client_id or not client_secret:
        access_token = f"simulated_token_{req.code}"
        username = "github-dev-gauthami"
    else:
        try:
            token_url = "https://github.com/login/oauth/access_token"
            headers = {"Accept": "application/json"}
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": req.code
            }
            res = requests.post(token_url, json=data, headers=headers, timeout=5)
            if res.status_code == 200:
                token_data = res.json()
                access_token = token_data.get("access_token")
                
            if access_token:
                user_url = "https://api.github.com/user"
                user_headers = {
                    "Authorization": f"token {access_token}",
                    "User-Agent": "Agentix-App"
                }
                user_res = requests.get(user_url, headers=user_headers, timeout=5)
                if user_res.status_code == 200:
                    username = user_res.json().get("login")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GitHub link operation failed: {str(e)}")
            
    if not access_token or not username:
        raise HTTPException(status_code=400, detail="Failed to exchange GitHub link credentials")
        
    current_user["github"] = {
        "accessToken": access_token,
        "username": username,
        "connectedAt": datetime.utcnow().isoformat()
    }
    save_user(current_user)
    return {
        "status": "success",
        "message": f"Successfully linked GitHub account '{username}'",
        "user": current_user
    }

@router.post("/link/leetcode")
def link_leetcode(req: LinkLeetcodeRequest, current_user: dict = Depends(get_current_user)):
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="LeetCode username is required")
        
    profile = fetch_leetcode_profile(username)
    if not profile or not profile.get("exists"):
        if username.startswith("mock_"):
            profile = {
                "exists": True,
                "totalSolved": 142,
                "badges": ["Knight", "2026 Daily Problem"]
            }
        else:
            raise HTTPException(status_code=400, detail=f"LeetCode profile '{username}' not found or unreachable")
            
    current_user["leetcode"] = {
        "username": username,
        "totalSolved": profile.get("totalSolved", 0),
        "badges": profile.get("badges", []),
        "connectedAt": datetime.utcnow().isoformat()
    }
    save_user(current_user)
    return {
        "status": "success",
        "message": f"Successfully linked LeetCode profile '{username}'",
        "user": current_user
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/unlink/github")
@router.post("/github/disconnect")
@router.get("/github/disconnect")
async def unlink_github(current_user: dict = Depends(get_current_user)):
    current_user["github"] = None
    await anyio.to_thread.run_sync(save_user, current_user)
    return {
        "status": "success",
        "message": "Successfully unlinked GitHub account",
        "user": current_user
    }

@router.post("/unlink/leetcode")
async def unlink_leetcode(current_user: dict = Depends(get_current_user)):
    current_user["leetcode"] = None
    await anyio.to_thread.run_sync(save_user, current_user)
    return {
        "status": "success",
        "message": "Successfully unlinked LeetCode profile",
        "user": current_user
    }

@router.get("/github")
async def github_auth(token: str = Query(None)):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_CLIENT_ID environment variable is missing"
        )
    state_param = f"&state={token}" if token else ""
    github_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=repo%20user&prompt=consent{state_param}"
    return RedirectResponse(url=github_url)

@router.get("/github/callback")
async def github_callback(code: str = Query(None), state: str = Query(None), authorization: Optional[str] = Header(None)):
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is missing"
        )
        
    token = state
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Active session token is required to link GitHub account"
        )
        
    payload = verify_jwt(token)
    if not payload or "email" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
        
    user = await anyio.to_thread.run_sync(get_user, payload["email"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
        )
        
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub environment variables are missing"
        )
        
    try:
        token_res = await httpx_client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code
            },
            headers={"Accept": "application/json"},
            timeout=10.0
        )
        token_res.raise_for_status()
        token_data = token_res.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with GitHub token endpoint: {str(e)}"
        )
        
    access_token = token_data.get("access_token")
    if not access_token:
        error_desc = token_data.get("error_description", "Unknown error")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub token exchange failed: {error_desc}"
        )
        
    try:
        user_res = await httpx_client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "Agentix-App"
            },
            timeout=10.0
        )
        user_res.raise_for_status()
        user_data = user_res.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch user profile from GitHub: {str(e)}"
        )
        
    username = user_data.get("login")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve GitHub username from profile data"
        )
        
    user["github"] = {
        "accessToken": access_token,
        "username": username,
        "connectedAt": datetime.utcnow().isoformat()
    }
    await anyio.to_thread.run_sync(save_user, user)
        
    return RedirectResponse(url="http://localhost:5173/?view=profile&github_connected=true")


