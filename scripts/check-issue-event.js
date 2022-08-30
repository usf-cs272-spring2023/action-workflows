// checks if the issue event is valid; i.e. a student is not modifying the issue improperly.
module.exports = async ({github, context, core}) => {
  // hard-coded allowed values used for validation
  const allowed = {
    // allowed issue titles
    titles: new Set([
      'Request Project Test Grade',
      'Request Project Review Grade',
      'Request Project Design Grade',
      'Request Project Code Review'
    ]),

    // users that are allowed to edit labels or assignees
    users: new Set(['sjengle', 'mtquach2', 'par5ul1', 'igentle292']),

    // allowed labels
    labels: new Set([
      'project1', 'project2', 'project3', 'project4',
      'grade-tests', 'grade-review', 'grade-design',
      'request-code-review', 'request-quick-review'
    ]),

    // labels to indicate some kind of error
    errors: new Set(['error', 'fixme'])
  };

  // placeholder to store error messages
  const error_messages = [];

  const params = {
    owner: context.payload.organization.login,
    repo: context.payload.repository.name,
    issue_number: context.payload.issue.number
  };

  core.info(JSON.stringify(params, null, "  "));
  core.info('');

  try {
    // get event information
    const action = context.payload.action;
    const sender = context.payload.sender.login;

    core.info(`Event Type:   ${action}`);
    core.info(`Event Sender: ${sender}`);
    core.info('');

    // get issue information
    const title = context.payload.issue.title;
    const labels = context.payload.issue.labels.map(x => x.name);
    const assignees = context.payload.issue.assignees.map(x => x.login);
    
    core.info(`Issue Title:     ${title}`);
    core.info(`Issue Labels:    ${JSON.stringify(labels)}`);
    core.info(`Issue Assignees: ${JSON.stringify(assignees)}`);
    core.info('');

    // check if issue title is valid
    if (!allowed.titles.has(title)) {
      error_messages.push(`Unexpected issue title: ${title}`);
    }

    // check to see if this issue was previously marked with an error
    if (labels.some(x => allowed.errors.has(x))) {
      error_messages.push(`Remove the "error" or "fixme" labels before re-opening this issue.`);
    }

    // check if issue labels are valid (or error)
    const invalid = labels.filter(x => !allowed.labels.has(x) && !allowed.errors.has(x));

    if (invalid.length > 0) {
      error_messages.push(`Found unexpected labels: ${invalid}`);
    }

    // check if valid event type
    switch (action) {
      case 'labeled':
        // check if valid event sender
        if (!allowed.users.has(sender)) {
          error_messages.push(`Only approved users may modify issue labels!`);
          await github.rest.issues.removeAllLabels(params);
        }
        break;

      case 'assigned':
        // check if valid event sender
        if (!allowed.users.has(sender)) {
          error_messages.push(`Only approved users may modify issue assignees!`);
          await github.rest.issues.removeAssignees({...params, assignees: assignees});
        }
        break;

      case 'opened':
      case 'reopened':
        break;

      default:
        error_messages.push(`Unexpected event type: ${action}`);
    }
  }
  catch (error) {
    error_messages.push(`Unexpected error: ${error.message}`);

    core.startGroup(`Outputting stack trace...`);
    console.trace(error);
    core.endGroup(``);
  }
  finally {
    if (error_messages.length > 0) {
      core.setFailed(`Found ${error_messages.length} problems with this issue.`);

      let issue_body = `
      @${context.actor} there were ${error_messages.length} problems with your issue:
      `;

      core.startGroup(`Outputting context...`);
      core.info(JSON.stringify(context, null, "  "));
      core.endGroup();

      core.startGroup(`Outputting errors...`);
      for (const message in error_messages) {
        core.error(message);

        issue_body += `
          1. ${message}
        `;
      }
      core.endGroup();

      issue_body += `
      :octocat: See [run id ${context.run_id}](https://github.com/${context.payload.repository.full_name}/actions/runs/${context.run_id}) for details.
      `

      // attempt to modify issue
      Promise.allSettled([
        github.rest.issues.addLabels({...params, labels: ['error']}),
        github.rest.issues.addAssignees({...params, assignees: [context.actor]}),
        github.rest.issues.createComment({...params, body: issue_body})
      ]).then(results => {
        core.startGroup(`Outputting status...`);
        for (const result in results) {
          core.info(`Status: ${result.status}, Reason: ${result.reason}`);
        }
        core.endGroup();
      });
    }
  }
};