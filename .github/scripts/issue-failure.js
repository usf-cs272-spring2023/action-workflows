// updates the issue comment with the failure
module.exports = async ({github, context, core}) => {
  try {
    const comment_id = process.env.COMMENT_ID;
    const message = `:octocat: @${ context.actor }, there are one or more problems with your request. You must address these problems and then re-open this issue. See [run #${context.runNumber} (id ${context.runId})](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for details.`;

    const updated = await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: comment_id,
      body: message
    });

    core.info(`Updated comment id ${updated.data.id} with one or more errors.`);
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);
    core.setFailed(`Unable to update comment for issue #${context?.payload?.issue?.number}.`);
  }

  try {
    const labels = ['error'];
    const assignees = [context.actor];
    const reason = "not_planned";

    const closed = await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      labels: labels,
      assignees: assignees,
      state: 'closed',
      state_reason: reason
    });

    core.info(`Closed issue #${context?.payload?.issue?.number} with one or more errors.`);
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update results for issue #${context?.payload?.issue?.number}.`);
  }  
};