import ast
from planner import llm

def evaluator_node(state):
    print("\n--- Evaluator Node ---")

    task = state.get("task", "")
    result = state.get("result", "")
    plan = state.get("plan", "")

    if not result or "No suitable tool found for" in result or "Error:" in result:
        print("[Evaluator] Tool Fallback triggered.")
        fallback_prompt = f"""
You are an expert AI Study Assistant.
The user asked: "{task}"
The agent selected or attempted a tool but it was not successful or no direct match was found.
Please respond to the user in a helpful, conversational, and natural way.
You can:
- Address their query using your general knowledge, OR
- Explain natively what you can do (e.g., help them set up study roadmaps, retrieve LeetCode questions for study, or manage tasks).

Keep the response clean, encouraging, and write in clear Markdown.
Do NOT output any technical or system errors.
"""
        response = llm.invoke(fallback_prompt)
        formatted_result = response.content
    else:
        stripped_res = result.strip()
        is_raw_structure = (
            (stripped_res.startswith("[") and stripped_res.endswith("]")) or 
            (stripped_res.startswith("{") and stripped_res.endswith("}")) or
            ("['" in stripped_res) or ('["' in stripped_res) or
            ("'," in stripped_res) or (", '" in stripped_res)
        )

        if is_raw_structure:
            print("[Evaluator] Formatting raw Python structures to Markdown.")
            format_prompt = f"""
You are a response formatter.
The user asked: "{task}"
The system returned the following raw data structure:
{result}

Please translate this raw data structure into a beautifully structured, clean Markdown document for the user.
Follow these rules:
1. Do NOT include raw Python code, brackets, or list notation in the final output.
2. Use bullet points, bold accents, and clear sections.
3. Format LeetCode problems cleanly as lists, highlighting difficulty where appropriate.
4. Format study tasks as a clear checklist or action items.
5. Output ONLY the formatted markdown response.
"""
            response = llm.invoke(format_prompt)
            formatted_result = response.content
        else:
            formatted_result = result

    formatted_result = formatted_result.strip()
    if formatted_result.startswith("[") and formatted_result.endswith("]"):
        try:
            parsed = ast.literal_eval(formatted_result)
            if isinstance(parsed, list):
                formatted_result = "\n".join(f"- {item}" for item in parsed)
        except Exception:
            formatted_result = formatted_result.lstrip("[").rstrip("]")
            formatted_result = formatted_result.replace("', '", "\n- ").replace('", "', "\n- ").replace("'", "").replace('"', "")

    if formatted_result.startswith("['") or formatted_result.startswith("[\""):
        formatted_result = formatted_result.replace("['", "").replace("']", "").replace('["', '').replace('"]', '')

    print("[Evaluator] Finished formatting.")

    return {
        "status": "done",
        "result": formatted_result
    }