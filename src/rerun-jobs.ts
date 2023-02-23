import {client} from './util'
import * as core from '@actions/core'

function log(message: string): void {
  core.info(message)
}
export async function rerunPrJobs(
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  const github = client()

  // get the PR
  const {data: pullRequest} = await github.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  })

  // Get check suites for the PR
  const {data} = await github.checks.listSuitesForRef({
    owner,
    repo,
    ref: pullRequest.head.sha
  })

  const checkSuites = data.check_suites

  // Get the check runs for each check suite
  for (const checkSuite of checkSuites) {
    log(`Check suite ${checkSuite.id} has status ${checkSuite.status}`)
    log(`Check suite ${checkSuite.id} has conclusion ${checkSuite.conclusion}`)
    if (!checkSuite.pull_requests) continue

    // Get runs for each check suite

    for (const pr of checkSuite.pull_requests) {
      const pullRequestUrl = `https://github.com/${owner}/${repo}/pull/${pr.number}`
      log(`The pr: ${pr.number}, url: ${pr.url}, html_url: ${pullRequestUrl}`)
      if (pr.number === prNumber) {
        log(`Rerunning check suite ${checkSuite.id}`)
        // Rerun the check suite
        await github.checks.rerequestSuite({
          owner,
          repo,
          check_suite_id: checkSuite.id
        })

        // // Get the check runs for the check suite
        // const {data: checkRuns} = await github.checks.listForRef({
        //   owner,
        //   repo,
        //   ref: pullRequest.head.sha,
        //   check_suite_id: checkSuite.id
        // })

        // // Check runs is same of current run
      }
    }
  }
}

export async function rerunJobsBySameWorkflow(
  owner: string,
  repo: string,
  prNumber: number,
  workflow: string
): Promise<void> {
  const github = client()

  // get the PR
  const {data: pullRequest} = await github.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  })

  // Get check suites for the PR
  const {data} = await github.checks.listSuitesForRef({
    owner,
    repo,
    ref: pullRequest.head.sha
  })

  // Get jobs for the PR and suite
  const checkSuites = data.check_suites
  for (const checkSuite of checkSuites) {
    const run = await github.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: checkSuite.id
    })

    // core.info(`run: \n ${JSON.stringify(run, null, 2)}`)

    const workflowRunner = run.data.jobs.filter(job => job.name === workflow)

    core.info(`workflowRunner: \n ${JSON.stringify(workflowRunner, null, 2)}`)
  }
}
