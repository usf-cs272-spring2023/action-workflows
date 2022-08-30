// checks if the issue event is valid; i.e. a student is not modifying the issue improperly.
module.exports = async ({github, context, core}) => {
  // hard-coded allowed values used for validation
  const allowed = {
    // allowed issue titles
    titles: new Set([
      'Request Project Tests Grade',
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
    ])
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

    // get issue information
    const title = context.payload.issue.title;
    const labels = context.payload.issue.labels.map(x => x.name);
    
    // check if issue title is valid
    if (!allowed.titles.has(title)) {
      error_messages.push(`Unexpected issue title: ${title}`);
      core.info(`❌ ${title}`);
    }
    else {
      core.info(`✅ ${title}`);
    }

    // check if issue labels are valid
    const invalid = labels.filter(x => !allowed.labels.has(x));

    if (invalid.length > 0) {
      error_messages.push(`Found unexpected labels: ${invalid}`);
      core.info(`❌ Labels: ${invalid}`);
    }
    else {
      core.info(`✅ Labels: ${labels}`);
    }

    // check to see if this issue was previously marked with an error
    if (invalid.includes('error')) {
      error_messages.push(`Remove the "error" label before re-opening this issue.`);
    }

    // check if valid event type
    switch (action) {
      case 'labeled':
        // check if valid event sender
        if (!allowed.users.has(sender)) {
          error_messages.push(`Only approved users may modify issue labels!`);

          core.setGroup(`❌ Action: ${action}, Sender: ${sender}`);
          const response = await github.rest.issues.removeAllLabels(params);
          core.info(JSON.stringify(response));
          core.endGroup();
        }
        else {
          core.info(`✅ Action: ${action}, Sender: ${sender}`);
        }
        break;

      case 'assigned':
        // check if valid event sender
        if (!allowed.users.has(sender)) {
          error_messages.push(`Only approved users may modify issue assignees!`);
         
          core.setGroup(`❌ Action: ${action}, Sender: ${sender}`);
          const assignees = context.payload.issue.assignees.map(x => x.login);
          const response = await github.rest.issues.removeAssignees({...params, assignees: assignees});
          core.info(JSON.stringify(response));
          core.endGroup();
        }
        else {
          core.info(`✅ Action: ${action}, Sender: ${sender}`);
        }
        break;

      case 'opened':
      case 'reopened':
        core.info(`✅ Action: ${action}, Sender: ${sender}`);
        break;

      default:
        error_messages.push(`Unexpected event type: ${action}`);
        core.info(`❌ Action: ${action}, Sender: ${sender}`);
    }
  }
  catch (error) {
    error_messages.push(`Unexpected error: ${error.message}`);
    core.startGroup(`❌ Unexpected Error: ${error.message}`);
    console.trace(error);
    core.endGroup(``);
  }
  finally {
    if (error_messages.length === 0) {
      core.info(`✅ Found ${error_messages.length} problem(s) with this issue.`);
    }
    else {
      core.setFailed(`❌ Found ${error_messages.length} problem(s) with this issue.`);
      core.info('');

      core.startGroup(`Outputting context...`);
      core.info(JSON.stringify(context, null, "  "));
      core.endGroup();

      core.startGroup(`Outputting errors...`);
      core.info(error_messages);
      for (const message in error_messages) {
        core.error(message);
      }
      core.endGroup();

      const formatted = error_messages.map(x => `  1. ${x}`);
      const issue_body = `@${context.actor} there were ${error_messages.length} problem(s) with your issue:

${formatted.join('\n')}

:octocat: See [run id ${context.runId}](https://github.com/${context.payload.repository.full_name}/actions/runs/${context.runId}) for details.
      `;

      // attempt to modify issue
      Promise.allSettled([
        github.rest.issues.addLabels({...params, labels: ['error']}),
        github.rest.issues.addAssignees({...params, assignees: [context.actor]}),
        github.rest.issues.createComment({...params, body: issue_body})
      ]).then((results) => {
        core.startGroup(`Outputting status...`);
        core.info(JSON.stringify(results));
        core.endGroup();
      });
    }
  }
};