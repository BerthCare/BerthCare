output "photos_bucket_arn" {
  description = "ARN of the photos bucket."
  value       = aws_s3_bucket.photos.arn
}

output "photos_bucket_name" {
  description = "Name of the photos bucket."
  value       = aws_s3_bucket.photos.bucket
}

output "exports_bucket_arn" {
  description = "ARN of the exports bucket."
  value       = aws_s3_bucket.exports.arn
}

output "exports_bucket_name" {
  description = "Name of the exports bucket."
  value       = aws_s3_bucket.exports.bucket
}
