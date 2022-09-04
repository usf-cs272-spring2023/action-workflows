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

    // check if no pull requests yet in repository
    if (!pull_list.hasOwnProperty('data') || pull_list.data.length == 0) {
      core.info('Found 0 pull requests.');

      if (minor != 0) {
        core.setFailed(`The release version should start with v${major}.0, not with v${major}.${minor}, since you have 0 code reviews. You may want to delete the ${release} release *and* tag (two separate steps).`);
      }

      return;
    }

    // otherwise we have pull requests to look through
    core.info(`Found ${pull_list.data.length} pull requests.`);

    // check if exceeding number of pull requests can fetch at once
    if (pull_list.data.length >= 100) {
      core.error(`Maximum number of pull requests exceeded. Results may be unreliable.`);
    }

    const approved = []; // stores pull requests approved by professor
    const project = `project${major}`; // label for this project code reviews

    // loop through all of the pull requests
    for (const pull of pull_list.data) {
      // check if pull request is for this project
      if (pull.labels.some(label => label.name == project)) {
        // get pull request reviews
        const reviews = github.rest.pulls.listReviews({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pull.number, // pull.id: issue number, pull.number: pull number
          per_page: 100
        });

        // check if the pull request was approved by the professor
        if (reviews.hasOwnProperty('data') && reviews.data.some(review => review.user.login == 'sjengle' && review.state == 'APPROVED')) {
          approved[project].push(pull);

          // check if this pull request passed code review
          if (pull.labels.some(label => label.name == 'review-passed')) {
            core.info(`Pull request #${pull.id} passed code review.`);
            core.setOutput('review_passed', pull.id);
          }
        }
      }
    }

    core.info(`Found ${approved.length} approved code reviews for project ${major}.`);

    // TODO Add output if found passing pull request for this project!
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Unable to check minor version of the ${release} release.`);
  }
}