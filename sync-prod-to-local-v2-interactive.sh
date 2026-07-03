#!/usr/bin/env bash
set -euo pipefail

PROD_HOST="jac@jac-server"
PROD_APP_DIR="/home/jac/luminaview-prod-securite"
LOCAL_APP_DIR="/Users/jac/docker/luminaview/blog-luminaview"

PROD_DUMP_IN_CONTAINER="/tmp/luminaview-prod.gz"
PROD_DUMP_ON_HOST="/tmp/luminaview-prod.gz"
LOCAL_DUMP_FILE="$LOCAL_APP_DIR/luminaview-prod.gz"
LOCAL_BACKUP_FILE="$LOCAL_APP_DIR/luminaview-local-backup.gz"
LOCAL_UPLOADS_DIR="$LOCAL_APP_DIR/data/uploads"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERREUR] %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Commande manquante: $1"
}

confirm() {
  local prompt="$1"
  local answer
  while true; do
    read -r -p "$prompt [y/n] " answer
    case "$answer" in
      y|Y|yes|YES) return 0 ;;
      n|N|no|NO) return 1 ;;
      *) echo "Réponds par y ou n." ;;
    esac
  done
}

check_local_prereqs() {
  log "Vérification des prérequis locaux"
  require_cmd ssh
  require_cmd scp
  require_cmd rsync
  require_cmd docker
  [ -d "$LOCAL_APP_DIR" ] || fail "Le dossier local n'existe pas: $LOCAL_APP_DIR"
  mkdir -p "$LOCAL_UPLOADS_DIR"
}

run_prod_dump() {
  log "Création du dump MongoDB sur le serveur de production"
  ssh "$PROD_HOST" "cd '$PROD_APP_DIR' && docker compose exec -T mongo sh -lc '
    mongodump \
      --uri \"mongodb://\$MONGO_INITDB_ROOT_USERNAME:\$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/luminaview?authSource=admin\" \
      --gzip \
      --archive=$PROD_DUMP_IN_CONTAINER
  '" || fail "Impossible de créer le dump MongoDB sur le serveur de production"
}

copy_prod_dump_to_host_tmp() {
  log "Copie du dump depuis le conteneur MongoDB vers l'hôte de production"
  ssh "$PROD_HOST" "cd '$PROD_APP_DIR' && cid=\$(docker compose ps -q mongo) && [ -n \"\$cid\" ] && docker cp \$cid:$PROD_DUMP_IN_CONTAINER $PROD_DUMP_ON_HOST" \
    || fail "Impossible de copier le dump hors du conteneur MongoDB"
}

fetch_dump_locally() {
  log "Rapatriement du dump de production vers la machine locale"
  scp "$PROD_HOST:$PROD_DUMP_ON_HOST" "$LOCAL_DUMP_FILE" \
    || fail "Impossible de rapatrier le dump de production"
  [ -f "$LOCAL_DUMP_FILE" ] || fail "Le dump local est introuvable après copie: $LOCAL_DUMP_FILE"
  log "Dump récupéré: $LOCAL_DUMP_FILE"
}

backup_local_db() {
  log "Sauvegarde de sécurité de la base locale"
  (
    cd "$LOCAL_APP_DIR"
    docker compose exec -T mongo sh -lc '
      mongodump \
        --db luminaview \
        --gzip \
        --archive=/tmp/luminaview-local-backup.gz
    '
    cid=$(docker compose ps -q mongo)
    [ -n "$cid" ] || exit 1
    docker cp "$cid:/tmp/luminaview-local-backup.gz" "$LOCAL_BACKUP_FILE"
  ) || fail "Impossible de sauvegarder la base locale"
  [ -f "$LOCAL_BACKUP_FILE" ] || fail "La sauvegarde locale est introuvable: $LOCAL_BACKUP_FILE"
  log "Sauvegarde locale créée: $LOCAL_BACKUP_FILE"
}

restore_local_db() {
  log "Restauration du dump de production dans MongoDB local"
  (
    cd "$LOCAL_APP_DIR"
    docker compose exec -T mongo sh -lc '
      mongorestore \
        --db luminaview \
        --drop \
        --gzip \
        --archive
    ' < "$LOCAL_DUMP_FILE"
  ) || fail "Impossible de restaurer le dump dans MongoDB local"
}

sync_uploads() {
  log "Synchronisation du dossier uploads depuis la production"
  rsync -av --progress \
    "$PROD_HOST:$PROD_APP_DIR/data/uploads/" \
    "$LOCAL_UPLOADS_DIR/" \
    || fail "Impossible de synchroniser les uploads"
}

show_verification_commands() {
  cat <<MSG

Commandes de vérification utiles :

cd "$LOCAL_APP_DIR"
docker compose exec mongo mongo luminaview --quiet --eval '
print("users=" + db.users.countDocuments({}));
print("albums=" + db.albums.countDocuments({}));
print("photos=" + db.photos.countDocuments({}));
'

ls -lh "$LOCAL_DUMP_FILE" "$LOCAL_BACKUP_FILE"

MSG
}

main() {
  check_local_prereqs
  run_prod_dump
  copy_prod_dump_to_host_tmp
  fetch_dump_locally
  backup_local_db

  if confirm "Restaurer maintenant la base locale avec le dump de production ?"; then
    restore_local_db
  else
    log "Restauration locale annulée par l'utilisateur"
  fi

  if confirm "Synchroniser maintenant le dossier uploads depuis la production ?"; then
    sync_uploads
  else
    log "Synchronisation des uploads annulée par l'utilisateur"
  fi

  log "Script terminé"
  show_verification_commands
}

main "$@"
