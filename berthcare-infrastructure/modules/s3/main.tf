locals {
  lifecycle_transition_days = 90
  lifecycle_expire_days     = 365 * 7
}

resource "aws_s3_bucket" "photos" {
  bucket = var.photos_bucket_name

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle_rule {
    id      = "photos-retention"
    enabled = true

    transition {
      days          = local.lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = local.lifecycle_expire_days
    }
  }
}

resource "aws_s3_bucket" "exports" {
  bucket = var.exports_bucket_name

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle_rule {
    id      = "exports-retention"
    enabled = true

    transition {
      days          = local.lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = local.lifecycle_expire_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "exports" {
  bucket = aws_s3_bucket.exports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "photos" {
  statement {
    sid = "AllowECSTaskRoleAccess"

    principals {
      type        = "AWS"
      identifiers = [var.task_role_arn]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.photos.arn,
      "${aws_s3_bucket.photos.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "photos" {
  bucket = aws_s3_bucket.photos.id
  policy = data.aws_iam_policy_document.photos.json
}

data "aws_iam_policy_document" "exports" {
  statement {
    sid = "AllowECSTaskRoleAccess"

    principals {
      type        = "AWS"
      identifiers = [var.task_role_arn]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.exports.arn,
      "${aws_s3_bucket.exports.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "exports" {
  bucket = aws_s3_bucket.exports.id
  policy = data.aws_iam_policy_document.exports.json
}
