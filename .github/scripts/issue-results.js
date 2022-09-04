// updates the issue comment with the results
module.exports = async ({github, context, core}) => {
  const comment_id = process.env.COMMENT_ID;
  const message = `:octocat: Request complete. See [run #${context.runNumber} (id ${context.runId})](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for details.`;

  try {
    const updated = await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: comment_id,
      body: message
    });

    core.info(`Updated comment id ${updated.data.id}.`);

    const labels = []; // TODO
    const assignees = []; // TODO
    const milestone = undefined; // TODO

    let reason = "not_planned"; // TODO or "completed"

    const closed = await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.issue.number,
      labels: labels,
      assignees: assignees,
      state: 'closed',
      state_reason: reason
    });

    // TODO Check if should close milestone

  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update issue comment.`);
  }
};