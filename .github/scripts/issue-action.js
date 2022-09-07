// fetches the relevant action run for the specified release
module.exports = async ({github, context, core}) => {
  const error_messages = [];
  const output = {};

  try {
    const release = process.env.RELEASE_TAG;
    const major = parseInt(process.env.VERSION_MAJOR);
    const minor = parseInt(process.env.VERSION_MINOR);
    const patch = parseInt(process.env.VERSION_PATCH);
  
    core.info(`Release: ${release}, Project: ${major}, Review: ${minor}, Patch: ${patch}`);

    const response = await github.rest.actions.listWorkflowRuns({
      owner: context.repo.owner,
      repo: context.repo.repo,
      workflow_id: 'project-release.yml',
      per_page: 100
    });

    if (response.data.length >= 100) {
      error_messages.push(`Maximum number of workflow runs exceeded. Results may be unreliable.`);
    }

    core.info(JSON.stringify(response.data));



    // if grade_tests, need release action run and issues
    // if request_review, need release action run and issues

    // if grade_review, need release action run and pull requests
    // if grade_design, need release action run and pull requests
    throw new Error('Not implemented.');
  }
  catch (error) {
    // add error and output stack trace
    error_messages.push(`Unexpected error: ${error.message}`);

    core.info('');
    core.startGroup(`Unexpected ${error.name} encountered...`);
    core.info(error.stack);
    core.endGroup();
  }
  finally {
    // output and set results
    core.startGroup('Setting output...');
    for (const property in output) {
      console.log(`${property}: ${output[property]}`);
      core.setOutput(property, output[property]);
    }
    core.endGroup();

    // save and output all errors
    if (error_messages.length > 0) {
      const formatted = error_messages.map(x => `  1. ${x}\n`).join('');
      core.setOutput('error_messages', formatted);

      core.startGroup(`Outputting errors...`);
      for (const message of error_messages) {
        core.error(message);
      }
      core.endGroup();

      core.setFailed(`Found ${error_messages.length} problems while fetching action run.`);
    }
  }
};