// verifies that this is a valid request
module.exports = async ({github, context, core}) => {
  const error_messages = [];
  const output = {};

  // most actions use _ underscore in names, e.g. grade_tests
  // unfortunately the associated labels use - dash in name. e/g/ grade-tests

  try {
    const results = JSON.parse(process.env.RESULTS_JSON);
    const request_type = process.env.REQUEST_TYPE;

    const release = process.env.RELEASE_TAG;
    const major = parseInt(process.env.VERSION_MAJOR);
    const minor = parseInt(process.env.VERSION_MINOR);
    const patch = parseInt(process.env.VERSION_PATCH);

    if (!results.hasOwnProperty(request_type) || `${results[request_type]}` != 'true') {
      error_messages.push(`The release ${results.release} is not eligible for this type of request.`);
      return; // exit out of try block
    }

    // get all issues and pull requests
    const response = await github.rest.issues.listForRepo({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'all',
      per_page: 100
    });

    if (response.data.length >= 100) {
      error_messages.push(`Maximum number of issues exceeded. Results may be unreliable.`);
    }

    // stores all parsed issues
    const parsed = {
      'project1': {},
      'project2': {},
      'project3': {},
      'project4': {}
    };

    // loop through all found issues
    issues: for (const issue of response.data) {
      // loop through all of the issues
      let project = undefined;
      let issue_types = [];

      core.info(JSON.stringify(issue.labels));

      labels: for (const label in issue.labels) {
        core.info(label);
        switch (label.name) {
          case 'error':
            core.info(`Skipping issue #${issue.number} due to "error" label.`);
            continue issues;
          
          case 'project1':
          case 'project2':
          case 'project3':
          case 'project4':
            project = label.name;
            break;
          
          case 'grade-tests':
          case 'grade-review':
          case 'grade-design':
          case 'request-code-review':
          case 'request-quick-review':
          case 'resubmit-code-review':
          case 'resubmit-quick-review':
          case 'review-passed':
            issue_types.push(label.name);
            break;
          
          default:
            core.warning(`Issue #${issue.number} has an unexpected "${label.name}" label.`);
        }
      }

      // store results
      for (const issue_type in issue_types) {
        if (!parsed[project].hasOwnProperty(issue_type)) {
          parsed[project][issue_type] = [];
        }

        parsed[project][issue_type].push(issue);
      }
    }

    core.startGroup(`Outputting parsed issues...`);
    core.info(JSON.stringify(parsed));
    core.endGroup();

    const current  = parsed[`project${major}`];
    const previous = major > 1 ? parsed[`project${major - 1}`] : undefined;

    switch (request_type) {
      case 'grade_tests':
        // check if there is an issue for this request already
        if (current?.['grade-tests']?.length > 0) {
          const found = current['grade-tests'][0];
          error_messages.push(`You already requested a project ${major} tests grade in issue ${found.number}. You only need to request this grade ONCE per project. If the issue is closed and you do not see a grade on Canvas yet, please post on Piazza asking for an update.`);
          return; // exit out of try block
        }

        // check if there is a previous project
        if (previous != undefined) {
          // check if there is at least one code review for that project
          const reviews = previous?.['grade-review']?.length;
          if (reviews == undefined || reviews < 1) {
            error_messages.push(`You must request at least one review grade for project ${major - 1} before requesting a tests grade for project ${major}.`);
            return; // exit out of try block
          }

          core.info(`Found ${reviews} review grade requests for project ${major - 1}.`);
        }

        output.assignment_name = `Project ${major} Tests`;
        output.start_points = 100;
        output.submitted_date = results.release_date;
        output.labels = JSON.stringify([`project${major}`, 'grade-tests', release]);
        output.milestone = `Project ${major}`;
        break;
      
      case 'grade_review':
      case 'grade_design':
      case 'request_review':
        error_messages.push('This request type is not yet supported.');
        break;
      
      default:
        error_messages.push(`Unexpected request type: ${request_type}`);
    }
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

      core.setFailed(`Found ${error_messages.length} problems while verifying this request.`);
    }
  }
};