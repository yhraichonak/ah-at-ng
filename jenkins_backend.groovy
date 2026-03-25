
@NonCPS
def countKnownIssues() {
    def action = currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction)
    if (action == null) {
        return 0
    }

    def allTests = action.getFailedTests()

    return allTests.count { test ->
        test.name?.contains("KNOWN ISSUE")
    }
}

pipeline {
    triggers {
        cron('0 5 * * 1-5')
      }
  agent any
  options { timestamps () }
      parameters {
                   choice(name: 'nodeRunner', choices: ['test', 'testMatching', 'dryTest', 'perftest'],description: 'Node JS runner script:<br/><b>test</b> - regular test suites runner<br/><b>testMatching</b> - run tests by name matching<br/><b>dryTest</b> - list tests instead of run<br/><b>perftest</b> - performance tests runner')
                    string(name: 'testParameters', defaultValue: "", description: "Target test for execution (differ for Node runner):<br/><b>test</b>: --runTestsByPath tests/whoami.spec.ts <br/><b>testMatching</b>: \"Global Search\"")
                    choice(name: 'testEnv', choices: ['stg', 'local'],description: 'Test environment')
                    booleanParam(name: 'traceAPICalls', defaultValue: false,description: 'Debug API calls requests and responses')
                    booleanParam(name: 'postInSlack', defaultValue: true ,description: 'Post test results in Slack')

}
  stages {
    stage('Aggregate results') {
      steps {
        checkout scmGit(
            branches: [[name: '*/main']],
            extensions: [],
            userRemoteConfigs: [[credentialsId: 'githubng2',
            url: 'https://github.com/Annuity-Management/test-automation.git']])

            nodejs('latest')
             {
            sh 'node --version && echo $PATH'
            sh 'npm install'

            withCredentials([string(credentialsId: 'freshdesk', variable: 'freshdesk_auth')]) {
                   sh 'ENVIRONMENT='+params.testEnv+' DETAILED_API_REPORTING='+params.traceAPICalls+' FRESHDESK_AUTH=${freshdesk_auth} npm run '+params.nodeRunner+' '+params.testParameters+' --runInBand || true'
                   sh 'npm run processKnownIssues'
                }
             }
      }
    }
  }
 post {
        always {
            script {
                println "Post test execution steps...";
                 def buildStatus=currentBuild.currentResult
                 def colorCode
                 if (buildStatus == 'STARTED') {colorCode = '#FFFF00'}
                 else if (buildStatus == 'SUCCESS') {colorCode = '#2EB886'}
                 else {colorCode = '#FF0000'}
                 println "Current build result: "+currentBuild.currentResult;

                 allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
                 // archiveArtifacts artifacts: 'allure-results/*.*', followSymlinks: false, allowEmptyArchive: true
                 def summary=junit(allowEmptyResults: true, skipMarkingBuildUnstable: true, testResults: 'junit.xml')
                 def knownIssuesCount = countKnownIssues()
                 echo "⚠️ KNOWN ISSUE tests: ${knownIssuesCount}"
                 def adjustedFailCount=summary.failCount - knownIssuesCount
                 if (adjustedFailCount>0){
                     colorCode = '#DAA038'
                 }
                 if (summary.totalCount>0){
                          currentBuild.displayName = "#${env.BUILD_NUMBER} - ${summary.totalCount} (${String.format('%.2f', summary.passCount * 100.0 / summary.totalCount)}% pass)"
                  }else{
                    currentBuild.displayName = "#${env.BUILD_NUMBER}"
                    }
                //currentBuild.description = "Triggered by ${params.trigger}"

                println "Current JUNIT result: "+summary;
                if (params.postInSlack)
                {
                    slackSend(channel: "#ah-automated-testing", color: colorCode, tokenCredentialId: "slack-bot",
                     message: "${env.JOB_NAME} - #${env.BUILD_NUMBER} ${buildStatus} after ${currentBuild.durationString.replace(' and counting', '')} (<${env.BUILD_URL}|Open>)\n Test Summary - ${summary.totalCount}, Failures: ${adjustedFailCount}, Known Issues: ${knownIssuesCount}, Skipped: ${summary.skipCount}, Passed: ${summary.passCount}")
                }
            }
        }
    }
}
