terraform {
  required_version = ">= 1.7"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.43"
    }
  }

  # ── Estado remoto en DO Spaces (S3-compatible) ──────────────────────────────
  # Descomentar tras crear el bucket `piums-terraform-state` en Spaces y exportar
  # AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY con las Spaces keys. `region` es un
  # placeholder que el SDK exige pero DO ignora.
  #
  # backend "s3" {
  #   endpoints                   = { s3 = "https://nyc3.digitaloceanspaces.com" }
  #   bucket                      = "piums-terraform-state"
  #   key                         = "piums-platform/do/terraform.tfstate"
  #   region                      = "us-east-1"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   skip_s3_checksum            = true
  # }
}
