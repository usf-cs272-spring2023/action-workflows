// checks if the issue event is valid; i.e. a student is not modifying the issue improperly.
module.exports = async ({github, context, core}) => {
  // users that are allowed to edit labels or assignees
  const allowed = new Set(['sjengle', 'mtquach2', 'par5ul1', 'igentle292']);

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

    if (!allowed.users.has(sender)) {
      error_messages.push(`Only approved users may modify issue labels and assignees!`);
      core.setGroup(`❌ Action: ${action}, Sender: ${sender}`);

      switch (action) {
        case 'labeled':
          const label = context.payload.label.name;
          const removeLabel = await github.rest.issues.removeLabel({...params, name: label});

          break;

        case 'assigned':
          const assignee = context.payload.assignee.login;
          const removeAssignee = await github.rest.issues.removeAssignees({...params, assignees: assignee});
          break;

        default:
          error_messages.push(`Unexpected event type: \`${action}\``);
      }
      
      core.endGroup();
    }
    else {
      core.info(`✅ Action: ${action}, Sender: ${sender}`);
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

      default:
        error_messages.push(`Unexpected event type: \`${action}\``);
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
      for (const message of error_messages) {
        core.error(message);
      }
      core.endGroup();

      const formatted = error_messages.map(x => `  1. ${x}`);
      const issue_body = `@${context.actor} there are ${error_messages.length} problem(s) with your issue:

${formatted.join('\n')}

:octocat: See [run id ${context.runId}](https://github.com/${context.payload.repository.full_name}/actions/runs/${context.runId}) for details.
      `;

      // attempt to modify issue
      Promise.allSettled([
        github.rest.issues.update({...params, labels: ['error'], assignees: [context.actor], state: 'closed'}),
        github.rest.issues.createComment({...params, body: issue_body})
      ]).then((results) => {
        core.startGroup(`Outputting status...`);
        core.info(JSON.stringify(results));
        core.endGroup();
      });
    }
  }
};