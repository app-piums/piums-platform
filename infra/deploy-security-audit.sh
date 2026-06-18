#!/usr/bin/env bash
# Deploy de correcciones del audit de seguridad 2026-06-18
# Requiere: AWS CLI + credenciales, kubeconfig apuntando al cluster EKS de produccion

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
TF_DIR="$(cd "$(dirname "$0")/terraform" && pwd)"
K8S_BASE="$(cd "$(dirname "$0")/k8s/base" && pwd)"
K8S_INGRESS="$(cd "$(dirname "$0")/k8s/ingress-nginx" && pwd)"

echo "[1/4] Aplicando cambios de K8s base (HSTS + limit-connections en ingress)..."
kubectl apply -k "$K8S_BASE"

echo "[2/4] Creando SG restrictivo para el NLB (solo 80/443)..."
cd "$TF_DIR"
terraform init -input=false
terraform apply -input=false -auto-approve -target=module.eks.aws_security_group.nginx_lb

SG_ID=$(terraform output -raw nginx_lb_security_group_id)
echo "    SG creado: $SG_ID"

echo "[3/4] Inyectando SG ID en el patch del Service..."
PATCH_FILE="$K8S_INGRESS/service-patch.yaml"
sed -i.bak "s/REPLACE_WITH_NGINX_LB_SG_ID/$SG_ID/" "$PATCH_FILE"
rm -f "${PATCH_FILE}.bak"

echo "[4/4] Aplicando ConfigMap del ingress controller + patch del Service..."
kubectl apply -k "$K8S_INGRESS"

echo ""
echo "Hecho. Verifica que el NLB solo responde en 80/443:"
echo "  nmap -p 80,443,8080,8443 backend.piums.io"
