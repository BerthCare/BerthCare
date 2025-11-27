resource "aws_route53_zone" "private" {
  name = var.zone_name

  vpc {
    vpc_id = var.vpc_id
  }

  comment = "Private zone for ${var.zone_name} (${var.environment})"
}

resource "aws_route53_record" "alb_alias" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "${var.environment}.${var.zone_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
