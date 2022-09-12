// verifies that this is a valid request
module.exports = async ({github, context, core}) => {
  const error_messages = [];
  const output = {};

  const labels = [];

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

    // update labels and milestone
    labels.push(`project${major}`);
    labels.push(release);
    output.milestone_name = `Project ${major}`;

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

      labels: for (const label of issue.labels) {
        switch (label.name) {
          case 'error':
            core.info(`Skipping issue #${issue.number} due to "error" label.`);
            continue issues;
          
          case 'project1': case 'project2': 
          case 'project3': case 'project4':
            project = label.name;
            break;
          
          case 'grade-tests': case 'grade-review': case 'grade-design':
          case 'request-code-review': case 'request-quick-review':
          case 'resubmit-code-review': case 'resubmit-quick-review':
          case 'review-passed':
            issue_types.push(label.name);
            break;
          
          default:
            if (!label.name.startsWith('v')) {
              core.info(`Issue #${issue.number} has an unexpected "${label.name}" label.`);
            }
        }
      }

      // store results
      for (const issue_type of issue_types) {
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

          // if the found issue isn't this one
          if (found.number != context.issue.number) {
            error_messages.push(`You already requested a project ${major} tests grade in issue #${found.number}. You only need to request this grade ONCE per project. If the issue is closed and you do not see a grade on Canvas yet, please post on Piazza asking for an update.`);
            return; // exit out of try block
          }
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

        labels.push('grade-tests');
        output.assignment_name = `Project ${major} Tests`;
        output.starting_points = 100;
        output.submitted_date  = results.release_date;
        break;

      case 'request_review':
        // make sure there is already a test grade issue
        if ((current?.['grade-tests']?.length || 0) < 1) {
          error_messages.push(`You must have a passing project ${major} tests grade issue before requesting your first code review appointment.`);
          return; // exit out of try block
        }

        // check if there is a design grade issue for that project
        if ((previous != undefined)  && (previous?.['grade-design']?.length || 0) < 1 ) {
          error_messages.push(`You must have a passing project ${major - 1} design grade issue before requesting your first project ${major} code review appointment.`);
          return; // exit out of try block
        }

        // make sure didn't already pass code review
        if ((current?.['review-passed']?.length || 0) > 0) {
          error_messages.push(`You passed code review in #${current['review-passed'][0].number} and do not need any more project ${major} code reviews. Did you mean to request a design grade instead?`);
          return; // exit out of try block
        }

        // determine code review type
        const code_reviews  = (current?.['resubmit-code-review']?.length  || 0);
        const quick_reviews = (current?.['resubmit-quick-review']?.length || 0); 

        output.last_type = false;
        output.last_pull = false;
        output.last_date = false;

        output.this_type = 'request-code-review';
        output.this_date = false;

        if (code_reviews != 0) {
          // check most recent pull request to determine if should be a code review or quick review
          error_messages.push('This option is not yet supported.');
          return;
        }

        labels.push(output.this_type);
        break;

      case 'grade_review':
      case 'grade_design':
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
    // convert labels to json
    output.labels = JSON.stringify(labels);

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