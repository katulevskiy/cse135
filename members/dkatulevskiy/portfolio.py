#!/usr/bin/env python3
"""
Portfolio Generator - Create a structured JSON portfolio from GitHub repositories,
sorted by total number of commits.
"""

import os
import json
import re
import time
import random
from pathlib import Path
from dotenv import load_dotenv
import requests
from actions import GitHubActions

# Load environment variables
load_dotenv()
JWT_TOKEN = os.getenv("JWT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
API_ENDPOINT = os.getenv("API_ENDPOINT", "http://localhost:3000/api/chat/completions")
MODEL_NAME = os.getenv("MODEL_NAME", "phi4:latest")
OUTPUT_FILE = "projects.json"


def call_llm_api(prompt, system_prompt=None, temperature=0.7, max_tokens=2000):
    """
    Call the LLM API with a prompt

    Args:
        prompt (str): User prompt
        system_prompt (str): Optional system prompt
        temperature (float): Sampling temperature
        max_tokens (int): Maximum tokens to generate

    Returns:
        str: LLM response
    """
    if system_prompt is None:
        system_prompt = "You are a helpful assistant that creates compelling descriptions and tags for software projects."

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    headers = {"Content-Type": "application/json"}

    if JWT_TOKEN:
        headers["Authorization"] = f"Bearer {JWT_TOKEN}"

    try:
        response = requests.post(API_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        # Extract content from the response
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        return f"Error: {str(e)}"


def get_contributors_count(github_actions, repo_full_name):
    """
    Get the total number of contributors for a repository
    """
    try:
        repo = github_actions.github.get_repo(repo_full_name)
        contributors = repo.get_contributors()
        try:
            return contributors.totalCount
        except:
            count = 0
            for _ in contributors:
                count += 1
            return count
    except Exception as e:
        print(f"Error getting contributors for {repo_full_name}: {e}")
        return 0


def generate_project_details(repo_info):
    """
    Generate enhanced title, description, tags, project status, and license type for a repository

    Args:
        repo_info (dict): Repository information

    Returns:
        dict: Enhanced project details including project_status and license_type
    """
    repo_name = repo_info["name"]
    repo_description = repo_info.get("description", "")
    repo_language = repo_info.get("language", "Unknown")
    commit_count = repo_info.get("commit_count", 0)
    contributors = repo_info.get("contributors", 0)
    license_info = repo_info.get("license", "No License")

    print(f"Generating enhanced details for {repo_name} ({commit_count} commits)...")

    # Create prompt for the LLM with additional repository stats
    prompt = f"""
I need to create compelling project descriptions for my portfolio. Please enhance the following project with a creative title, detailed description, and relevant tags, and also generate additional repository stats.

Repository Name: {repo_name}
Original Description: {repo_description}
Primary Language: {repo_language}
Total Commits: {commit_count}
Total Contributors: {contributors}
License Info: {license_info}

Please provide the following:

1. A creative and professional title (not just the repository name)
2. A detailed description that is AT LEAST 100 WORDS long. This description should thoroughly explain the project's purpose, technology highlights, challenges overcome, and key features. Make it sound impressive and professional.
3. A list of 4-6 relevant technology tags based on the repository information.
4. Project Status: Provide a status such as "Active", "Completed", "In Progress", etc. based on the repository's activity and commit count.
5. License Type: Suggest a common open-source license type (e.g., MIT, GPL, Apache, etc.) that best fits the repository's nature.

Format your response as a JSON object with these fields:
{{
  "title": "Enhanced Title",
  "description": "Detailed description that is at least 100 words long...",
  "tags": "Tag1, Tag2, Tag3, Tag4, Tag5",
  "project_status": "Active/Completed/In Progress",
  "license_type": "MIT/GPL/Apache, etc."
}}

Be descriptive, technical, and specific. If the original description is minimal, use your creativity to imagine what the project might do based on its name and language, while keeping the description plausible and professional.
"""

    response = call_llm_api(prompt)

    try:
        # Look for JSON object anywhere in the response
        match = re.search(r"({[\s\S]*})", response, re.DOTALL)
        if match:
            json_str = match.group(1)
            enhanced_details = json.loads(json_str)
            return enhanced_details
        else:
            print(f"No valid JSON found in response for {repo_name}")
            # Create a fallback response
            return {
                "title": f"Enhanced {repo_name.replace('-', ' ').title()}",
                "description": repo_description
                or f"A sophisticated {repo_language} project that demonstrates advanced programming skills and software development expertise. This project implements best practices in software architecture, with careful attention to code quality, performance, and user experience. The codebase showcases modular design patterns, efficient algorithms, and comprehensive error handling to ensure robustness in various scenarios. Throughout development, emphasis was placed on maintainability, extensibility, and clear documentation to facilitate collaboration and future enhancements. The project represents a significant achievement in software engineering, highlighting technical proficiency and problem-solving capabilities.",
                "tags": f"{repo_language}, Software Development, Programming, Technical Excellence, Best Practices",
                "project_status": "Active",
                "license_type": "MIT",
            }
    except Exception as e:
        print(f"Error parsing response for {repo_name}: {e}")
        # Create a fallback response
        return {
            "title": f"Enhanced {repo_name.replace('-', ' ').title()}",
            "description": repo_description
            or f"A sophisticated {repo_language} project that demonstrates advanced programming skills and software development expertise. This project implements best practices in software architecture, with careful attention to code quality, performance, and user experience. The codebase showcases modular design patterns, efficient algorithms, and comprehensive error handling to ensure robustness in various scenarios. Throughout development, emphasis was placed on maintainability, extensibility, and clear documentation to facilitate collaboration and future enhancements. The project represents a significant achievement in software engineering, highlighting technical proficiency and problem-solving capabilities.",
            "tags": f"{repo_language}, Software Development, Programming, Technical Excellence, Best Practices",
            "project_status": "Active",
            "license_type": "MIT",
        }


def get_commit_count(github_actions, repo_full_name):
    """
    Get the total number of commits for a repository

    Args:
        github_actions (GitHubActions): GitHub actions instance
        repo_full_name (str): Full name of the repository (username/repo)

    Returns:
        int: Total number of commits
    """
    try:
        repo = github_actions.github.get_repo(repo_full_name)
        commits = repo.get_commits()
        try:
            return commits.totalCount
        except:
            print(f"Counting commits manually for {repo_full_name}...")
            commit_count = 0
            for _ in commits:
                commit_count += 1
                if commit_count >= 1000:
                    print(f"Reached 1000 commits, stopping count for {repo_full_name}")
                    break
            return commit_count
    except Exception as e:
        print(f"Error getting commit count for {repo_full_name}: {e}")
        return 0


def get_user_repositories(github_actions):
    """
    Get all public repositories for the authenticated user and sort by commit count

    Args:
        github_actions (GitHubActions): GitHub actions instance

    Returns:
        list: User public repositories sorted by commit count
    """
    try:
        user = github_actions.user.login
        print(f"Fetching public repositories for user: {user}")

        repos = github_actions.user.get_repos()
        user_repos = []
        print("Collecting repository information...")
        for repo in repos:
            if repo.owner.login == user and not repo.private:
                print(f"Getting commit count for {repo.full_name}...")
                commit_count = get_commit_count(github_actions, repo.full_name)
                repo_info = {
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "language": repo.language,
                    "url": repo.html_url,
                    "created_at": (
                        repo.created_at.isoformat() if repo.created_at else None
                    ),
                    "updated_at": (
                        repo.updated_at.isoformat() if repo.updated_at else None
                    ),
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "commit_count": commit_count,
                    "contributors": get_contributors_count(
                        github_actions, repo.full_name
                    ),
                    "license": (
                        repo.license.spdx_id
                        if repo.license and hasattr(repo.license, "spdx_id")
                        else "No License"
                    ),
                }
                user_repos.append(repo_info)

        # Sort repositories by commit count (descending)
        user_repos.sort(key=lambda x: x.get("commit_count", 0), reverse=True)
        print(f"Found {len(user_repos)} public repositories, sorted by commit count:")
        for repo in user_repos:
            print(f"- {repo['full_name']}: {repo['commit_count']} commits")
        return user_repos

    except Exception as e:
        print(f"Error fetching repositories: {e}")
        return []


def create_portfolio(repositories):
    """
    Create portfolio data structure from repositories

    Args:
        repositories (list): Repository information

    Returns:
        list: Portfolio projects
    """
    portfolio_projects = []
    for i, repo in enumerate(repositories):
        project_id = f"proj{i+1}"
        enhanced_details = generate_project_details(repo)
        image_filename = f"assets/{project_id}-800.webp"
        alt_text = f"Artistic concept representing the {enhanced_details.get('title', repo['name'])} project"
        project = {
            "id": project_id,
            "title": enhanced_details.get("title", f"Enhanced {repo['name']}"),
            "description": enhanced_details.get(
                "description",
                repo.get("description", "A software development project."),
            ),
            "image": image_filename,
            "alt": alt_text,
            "github": repo["url"],
            "tags": enhanced_details.get(
                "tags", repo.get("language", "Software Development")
            ),
            "commit_count": repo.get("commit_count", 0),
            "contributors": repo.get("contributors", 0),
            "project_status": enhanced_details.get("project_status", "Active"),
            "license_type": enhanced_details.get("license_type", "MIT"),
        }
        portfolio_projects.append(project)
        print(
            f"Added {project['title']} to portfolio (Commits: {repo.get('commit_count', 0)})"
        )
    return portfolio_projects


def main():
    """Main function"""
    if not GITHUB_TOKEN:
        print("Error: GITHUB_TOKEN environment variable is not set")
        return

    github = GitHubActions(GITHUB_TOKEN)
    repositories = get_user_repositories(github)

    if not repositories:
        print("No repositories found")
        return

    print(f"Found {len(repositories)} repositories")
    try:
        num_repos_input = input(
            f"How many repositories to include? (1-{len(repositories)} or 'all', default: all): "
        )

        if num_repos_input.lower() == "all" or not num_repos_input.strip():
            num_repos = len(repositories)
            print(f"Including all {num_repos} repositories")
        else:
            num_repos = int(num_repos_input)
            num_repos = max(1, min(num_repos, len(repositories)))
            print(f"Including top {num_repos} repositories by commit count")
    except ValueError:
        num_repos = len(repositories)
        print(f"Invalid input. Using default: all {num_repos} repositories")

    selected_repos = repositories[:num_repos]
    portfolio_projects = create_portfolio(selected_repos)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(portfolio_projects, f, indent=2)

    print(f"\nPortfolio created successfully with {len(portfolio_projects)} projects!")
    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
