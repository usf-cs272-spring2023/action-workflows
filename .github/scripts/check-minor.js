// checks the pull requests to determine if the minor number makes sense
module.exports = async ({github, context, core}) => {
  const release = process.env.RELEASE_TAG;
  const major = parseInt(process.env.VERSION_MAJOR);
  const minor = parseInt(process.env.VERSION_MINOR);
  const patch = parseInt(process.env.VERSION_PATCH);

  core.info(`Release: ${release}, Project: ${major}, Review: ${minor}, Patch: ${patch}`);

  try {
    const pull_list = github.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'all',
      per_page: 100
    });

    if (pull_list.data.length >= 100) {
      core.error(`Maximum number of pull requests exceeded. Results may be unreliable.`);
    }

    const pulls = {
      project1: [],
      project2: [],
      project3: [],
      project4: []
    };

    let count = 0; // track how many pull requests we looked at
    const approved = []; // track which pull requests are approved

    // group pulls by their project label
    pull_list.data.forEach(x => {
      const key = x.labels.find(x => x.startsWith('project'));

      if (key != undefined && pulls.hasOwnProperty(key)) {
        pulls[key].push(x);
        count++;
      }
    });

    core.info(`Kept ${count} out of ${pull_list.data.length} pull requests.`);

    for (const pull in pulls[`project${major}`]) {
      const review_list = github.rest.pulls.listReviews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pull.id,
        per_page: 100
      });

      // TODO Check if state == APPROVED and user.login == sjengle
    }
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Unable to check minor version of the ${release} release.`);
  }
}