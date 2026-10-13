pipeline {
  agent any

  tools { nodejs 'node20' }   // Manage Jenkins > Tools > NodeJS installations (name: node20)

  environment {
    IMAGE_NAME = 'careerconnect'
    CONTAINER  = 'careerconnect'
    HOST_PORT  = '3000'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      steps { sh 'npm install' }
    }

    stage('Continuous Testing') {          // Week 11
      steps { sh 'npm test' }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit.xml'
        }
      }
    }

    stage('Build Docker Image') {          // Weeks 7-10
      steps { sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest .' }
    }

    stage('Deploy Container') {
      steps {
        sh '''
          docker rm -f ${CONTAINER} || true
          docker run -d --name ${CONTAINER} -p ${HOST_PORT}:3000 ${IMAGE_NAME}:latest
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          for i in 1 2 3 4 5 6 7 8 9 10; do
            curl -sf http://localhost:${HOST_PORT}/api/health && exit 0
            sleep 3
          done
          echo "Health check failed"; docker logs ${CONTAINER}; exit 1
        '''
      }
    }

    // Weeks 12-14: configuration management with Ansible (enable once Ansible is installed on Jenkins host)
    stage('Ansible Configure') {
      when { expression { return fileExists('ansible/playbook.yml') && sh(script: 'which ansible-playbook', returnStatus: true) == 0 } }
      steps { sh 'ansible-playbook -i ansible/inventory.ini ansible/playbook.yml' }
    }
  }

  post {
    success { echo 'CareerConnect pipeline succeeded' }
    failure { echo 'Pipeline failed - check the stage logs' }
  }
}
