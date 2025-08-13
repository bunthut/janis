/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
require("dotenv").config()
const fs = require("fs-extra");
const axios = require("axios").default;

const packageJsonPath = "./package.json";
const changelogPath = "./CHANGELOG.md";

const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
const discourseApiKey = process.env.DISCOURSE_API_KEY;
const discourseUrl = "https://discourse.joplinapp.org";
const templatePluginTopicId = 17470;
const pluginRepo = "https://www.github.com/joplin/plugin-templates";

const getLatestRelease = async () => {
    const version = JSON.parse(await fs.readFile(packageJsonPath, "utf-8")).version;
    const changelog = await fs.readFile(changelogPath, "utf-8");

    const releaseHeadings = changelog.match(/###? \[.*/gm);

    const latestReleaseHeading = releaseHeadings[0];
    const secondLatestReleaseHeading = releaseHeadings[1];

    const startIndex = changelog.indexOf(latestReleaseHeading) + latestReleaseHeading.length + 3;
    const endIndex = changelog.indexOf(secondLatestReleaseHeading);

    const latestChangelog = changelog.substr(startIndex, endIndex-startIndex).trim();
    return {
        version: version,
        changelog: latestChangelog
    };
}

const createGithubRelease = async (release) => {
    const tagName = `v${release.version}`;

    const response = await axios.post(
        "https://api.github.com/repos/joplin/plugin-templates/releases",
        {
            tag_name: tagName,
            name: tagName,
            body: release.changelog
        },
        {
            headers: {
                "Authorization": `Token ${githubAccessToken}`
            }
        });

    return response.data.html_url;
}

const createJoplinReleasePost = async (release) => {
    const postContent = `## Release v${release.version} :rocket:\n${release.changelog}\n\n> For reporting bugs/feature-requests or to know more about the plugin visit the [GitHub Repo](${pluginRepo}).`;

    const response = await axios.post(
        `${discourseUrl}/posts.json`,
        {
            topic_id: `${templatePluginTopicId}`,
            raw: postContent
        },
        {
            headers: {
                "Api-Key": discourseApiKey,
                "Api-Username": "nishantwrp"
            }
        }
    );

    return `${discourseUrl}/t/${templatePluginTopicId}/${response.data.post_number}`;
}

const announceRelease = async () => {
    const release = await getLatestRelease();

    const githubReleaseUrl = await createGithubRelease(release);
    console.log("GitHub release created at", githubReleaseUrl);

    const discoursePostUrl = await createJoplinReleasePost(release);
    console.log("Discourse post created at", discoursePostUrl);
}

announceRelease();
