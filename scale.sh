#!/bin/bash

ROOT_DIR=$(dirname "$(readlink -e "$0")")

# https://www.beaubus.com/blog/resize_multiple_images_proportionally_with_ffmpeg_and_a_shell_function.html
# https://www.dangtrinh.com/2016/08/mass-resize-photos-in-linux-with-ffmpeg.html

# https://stackoverflow.com/questions/28806816/use-ffmpeg-to-resize-image
# https://stackoverflow.com/questions/8218363/maintaining-aspect-ratio-with-ffmpeg
# https://superuser.com/q/839751

# ffmpeg -f image2 -i "images/img-%02d.jpg" -vf scale="50:-1" images/small/thumb-%02d.jpg
# ffmpeg -i src -vf 'scale=if(gte(a\,320/240)\,min(320\,iw)\,-2):if(gte(a\,320/240)\,-2\,min(240\,ih))' dst

for f in images/*jpg
  do ffmpeg -i $f -vf "scale='if(gte(iw,ih),50,-1)':'if(gte(ih,iw),50,-1)'" ${f%%.jpg}-thumb.jpg
  # do ffmpeg -i $f -vf "thumbnail,scale='if(gt(iw,ih),50,trunc(oh*a/2)*2)':'if(gt(iw,ih),trunc(ow/a/2)*2,50)'" ${f%%.jpg}-thumb.jpg
done

# for f in images/*.jpg
#   do ffmpeg -i $f -vf scale=iw*.1:ih*.1 ${f%%.jpg}-thumb.jpg
# done
