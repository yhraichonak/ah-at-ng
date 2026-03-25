### Execution Test Automation in GutHub Actions
<img src="img/img_6.png" style="width:50%; height:auto;"></br>
1. Integration implemented via pipeline [test.yml](.github/workflows/test.yml)
2. GitHub Actions integrated in test automation repository

   <img src="img/img.png" style="width:50%; height:auto;">
3. Self-hosted Runner configured to run test automation against pre-deployed env. Use `ENVIRONEMNT=githubmac` while running the tests
<br/><img src="img/img_1.png" style="width:50%; height:auto;">
4. Tests triggers:
   1. On every commit
   <img src="img/img_2.png" style="width:50%; height:auto;">
   2. On demand manually by providing parameters</br>
   <img src="img/img_3.png" style="width:25%; height:auto;">
5. Once build execution is finished  - results are available from build page.</br>
   <img src="img/img_4.png" style="width:50%; height:auto;">
6. <ins>TODO</ins>: AllureReport publishing with test results historical trends [integration](https://allurereport.org/docs/integrations-github/#_3-set-up-publishing-to-github-pages ) (see example below).</br>
   https://yhraichonak.github.io/ah-at-ng/14/ </br>
   <img src="img/img_5.png" style="width:50%; height:auto;">