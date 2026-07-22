const getRepositories = async (req, res) => {
    try {
        const user = req.user;
        
        // If user profile has live GitHub token and repositories
        if (user && user.github && user.github.accessToken && Array.isArray(user.github.repositories) && user.github.repositories.length > 0) {
            return res.status(200).json({
                status: "success",
                repositories: user.github.repositories
            });
        }
        
        // Local development simulation or lack of live GitHub tokens fallback
        return res.status(200).json({
            status: "success",
            repositories: [
                { name: "OceanGuard", description: "Maritime incident reporting and verification system" },
                { name: "LingoLeap", description: "Language learning application architecture" },
                { name: "SiteGuard", description: "AI Safety monitoring and dashboard system" }
            ]
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to retrieve repositories"
        });
    }
};

module.exports = {
    getRepositories
};
