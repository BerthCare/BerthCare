data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  github_oidc_subjects = length(var.github_oidc_subjects) > 0 ? var.github_oidc_subjects : ["repo:${var.github_org}/${var.github_repo}:environment:${var.environment}"]
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.github_oidc_subjects
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-${var.environment}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "github_actions_deploy_base" {
  statement {
    sid       = "ECRGetAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
    # Required for docker push login; token is scoped by AWS to the account so limiting resources is not supported.
  }

  statement {
    sid = "ECRPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
      "ecr:DescribeRepositories",
    ]
    resources = [aws_ecr_repository.backend.arn]
    # Allow pushing the backend image to the single backend repo used by the dev environment.
  }

  statement {
    sid = "ECSDeploy"
    actions = [
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
      "ecs:DescribeServices",
    ]
    resources = [
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:task-definition/*",
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${var.cluster_name}/${var.ecs_service_name}",
      "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}",
    ]
    # Permit updating only the dev cluster/service and the task definition family in this account/region.
  }

  statement {
    sid = "PassTaskRoles"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      module.ecs.task_execution_role_arn,
      module.ecs.task_role_arn,
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
    # Restrict role passing to the ECS task roles required by this dev deployment.
  }
}

data "aws_iam_policy_document" "github_actions_deploy_secrets" {
  count = length(var.secrets_manager_arns) > 0 ? 1 : 0

  statement {
    sid = "SecretsRead"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = var.secrets_manager_arns
  }
}

data "aws_iam_policy_document" "github_actions_deploy_combined" {
  count = length(var.secrets_manager_arns) > 0 ? 1 : 0

  source_policy_documents = [
    data.aws_iam_policy_document.github_actions_deploy_base.json,
    data.aws_iam_policy_document.github_actions_deploy_secrets[0].json,
  ]
}

resource "aws_iam_policy" "github_actions_deploy" {
  name   = "${var.project_name}-${var.environment}-github-actions-deploy"
  policy = length(var.secrets_manager_arns) > 0 ? data.aws_iam_policy_document.github_actions_deploy_combined[0].json : data.aws_iam_policy_document.github_actions_deploy_base.json
}

resource "aws_iam_role_policy_attachment" "github_actions_deploy" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.github_actions_deploy.arn
}
