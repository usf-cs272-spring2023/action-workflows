// updates the issue comment with the results
module.exports = async ({github, context, core}) => {
  const comment_id = process.env.COMMENT_ID;
  const message = `:octocat: Request complete. See [run #${context.runNumber} (id ${context.runId})](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}) for details.`;

  try {
    const response = await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: comment_id,
      body: message
    });

    core.info(`Updated comment id ${response.data.id}.`);
  }
  catch (error) {
    core.info(`${error.name}: ${error.message}`);

    core.startGroup('Outputting context...');
    core.info(JSON.stringify(context));
    core.endGroup();

    core.setFailed(`Unable to update issue comment.`);
  }
};