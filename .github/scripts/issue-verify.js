// verifies that this is a valid request
module.exports = async ({github, context, core}) => {
  const error_messages = [];
  const output = {};

  try {
    const results = JSON.parse(process.env.RESULTS_JSON);
    const request_type = process.env.REQUEST_TYPE;

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

      labels: for (const label in issue.labels) {
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
    core.info(parsed);
    core.endGroup();

    // check for issues of same type and project
    // switch (request_type) {
    //   case 'grade-tests':
    //   case 'grade-design':
    //     if (parsed?.[`project${major}`]?.[request_type]?.length > 0) {
    //       const number = parsed[`project${major}`][request_type][0]['number'];
    //       error_messages.push(`You already have an issue for this type of request. Use issue #${number} instead.`);
    //       return; // exit out of try block
    //     }
    //     break;

    //   case 'grade-review':


    // }

    // check for required issues of previous project


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