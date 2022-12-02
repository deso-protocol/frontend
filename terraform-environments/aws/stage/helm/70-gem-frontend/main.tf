locals {
  aws_region        = "us-east-1"
  environment_name  = "stage"
  namespace         = "app"
  fullnameOverride  = "gem-frontend"
  replica_count     = 1
  docker_repository = "283278994941.dkr.ecr.us-east-1.amazonaws.com/frontend"
  docker_tag        = "v2.1.1.0"
  requests_memory   = "1Gi"

  tags = {
    ops_env              = "stage"
    ops_managed_by       = "terraform",
    ops_source_repo      = "kubernetes-ops",
    ops_source_repo_path = "terraform-environments/aws/stage",
    ops_owners           = "example-app",
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.37.0"
    }
    random = {
      source = "hashicorp/random"
    }
  }

  backend "remote" {
    organization = "gem-engineering"

    workspaces {
      name = "kubernetes-ops-stage-70-gem-frontend"
    }
  }
}

provider "aws" {
  region = local.aws_region
}

data "terraform_remote_state" "eks" {
  backend = "remote"
  config = {
    organization = "gem-engineering"
    workspaces = {
      name = "kubernetes-ops-stage-20-eks"
    }
  }
}

data "aws_eks_cluster_auth" "auth" {
  name = local.environment_name
}

provider "helm" {
  kubernetes {
    host                   = data.terraform_remote_state.eks.outputs.cluster_endpoint
    cluster_ca_certificate = base64decode(data.terraform_remote_state.eks.outputs.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.auth.token
  }
}

# Helm values file templating
data "template_file" "helm_values" {
  template = file("${path.module}/helm_values.yaml")

  # Parameters you want to pass into the helm_values.yaml.tpl file to be templated
  vars = {
    fullnameOverride  = local.fullnameOverride
    namespace         = local.namespace
    replica_count     = local.replica_count
    docker_repository = local.docker_repository
    docker_tag        = local.docker_tag
    requests_memory   = local.requests_memory
  }
}

module "app" {
  source = "github.com/ManagedKube/kubernetes-ops//terraform-modules/aws/helm/helm_generic?ref=v1.0.9"

  # this is the helm repo add URL
  repository = "https://helm-charts.managedkube.com"
  # This is the helm repo add name
  official_chart_name = "standard-application"
  # This is what you want to name the chart when deploying
  user_chart_name = local.fullnameOverride
  # The helm chart version you want to use
  helm_version = "1.0.19"
  # The namespace you want to install the chart into - it will create the namespace if it doesnt exist
  namespace = local.namespace
  # The helm chart values file
  helm_values = data.template_file.helm_values.rendered

  depends_on = [
    data.terraform_remote_state.eks
  ]
}
