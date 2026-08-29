#!/bin/bash
#
# resize_thumbs.sh — создание thumbnail-изображений с сохранением пропорций
#
# Использование:
#   ./resize_thumbs.sh [-w WIDTH] [-i INPUT_DIR] [-o OUTPUT_DIR] [-q QUALITY]
#
# Примеры:
#   ./resize_thumbs.sh                              # 300px, ./images -> ./thumbs
#   ./resize_thumbs.sh -w 500 -i photos -o out      # ширина 500px
#   ./resize_thumbs.sh -w 300 -i ./src -o ./dst -q 3

set -euo pipefail

# ─── Параметры по умолчанию ───────────────────────────────────────────
WIDTH=300
INPUT_DIR="./images"
OUTPUT_DIR="./thumbs"
QUALITY=2           # JPEG quality для ffmpeg: 2 (лучшее) … 31 (худшее)
PREFIX=""
EXTENSIONS="jpg jpeg png webp bmp tiff"

# ─── Разбор аргументов ────────────────────────────────────────────────
usage() {
    cat <<EOF
Использование: $0 [опции]

Опции:
  -w WIDTH    Ширина thumbnail в px (высота — пропорционально). По умолчанию: 300
  -i DIR      Входная директория. По умолчанию: ./images
  -o DIR      Выходная директория. По умолчанию: ./thumbs
  -q Q        Качество JPEG (2 = лучшее, 31 = худшее). По умолчанию: 2
  -p PREFIX   Префикс имени файла. По умолчанию: thumb-
  -h          Справка
EOF
    exit 1
}

while getopts "w:i:o:q:p:h" opt; do
    case $opt in
        w) WIDTH="$OPTARG" ;;
        i) INPUT_DIR="$OPTARG" ;;
        o) OUTPUT_DIR="$OPTARG" ;;
        q) QUALITY="$OPTARG" ;;
        p) PREFIX="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# ─── Проверки ─────────────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
    echo "Ошибка: ffmpeg не установлен." >&2
    exit 1
fi

if [[ ! -d "$INPUT_DIR" ]]; then
    echo "Ошибка: директория '$INPUT_DIR' не найдена." >&2
    exit 1
fi

if ! [[ "$WIDTH" =~ ^[0-9]+$ ]] || [[ "$WIDTH" -lt 1 ]]; then
    echo "Ошибка: ширина должна быть положительным числом." >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ─── Сбор файлов ──────────────────────────────────────────────────────
shopt -s nullglob nocaseglob
files=()
for ext in $EXTENSIONS; do
    files+=("$INPUT_DIR"/*."$ext")
done
shopt -u nocaseglob

if [[ ${#files[@]} -eq 0 ]]; then
    echo "В '$INPUT_DIR' не найдено изображений (${EXTENSIONS// /, })."
    exit 0
fi

# ─── Обработка ────────────────────────────────────────────────────────
total=${#files[@]}
count=0
errors=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Вход:      $INPUT_DIR  ($total файлов)"
echo "  Выход:     $OUTPUT_DIR"
echo "  Ширина:    ${WIDTH}px  (высота — пропорционально)"
echo "  Качество:  $QUALITY  (2=лучшее, 31=худшее)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for f in "${files[@]}"; do
    ((count++)) || true
    filename=$(basename "$f")
    name="${filename%.*}"
    out="${OUTPUT_DIR}/${PREFIX}${name}.jpg"

    printf "[%d/%d] %-40s " "$count" "$total" "$filename"

    if ffmpeg -y -i "$f" \
        -vf "scale=${WIDTH}:-1" \
        -q:v "$QUALITY" \
        "$out" \
        </dev/null 2>/dev/null; then
        echo "OK"
    else
        echo "ОШИБКА" >&2
        ((errors++)) || true
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Готово: $((total - errors))/$total успешно."
if [[ $errors -gt 0 ]]; then
    echo "Ошибок: $errors" >&2
    exit 1
fi
