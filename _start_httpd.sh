#/c/Users/devg1/lighttpd/lighttpd.exe  -D -f _lighttpd.conf
#/c/"Program Files"/lighttpd/lighttpd.exe  -D -f _lighttpd.conf

if [ -f /c/"Program Files"/lighttpd/lighttpd.exe  ]; then
    echo "win 1"
    /c/"Program Files"/lighttpd/lighttpd.exe  -D -f _lighttpd.conf.win

elif [ -f /c/Users/devg1/lighttpd/lighttpd.exe  ]; then
    echo "win 2"
    /c/Users/devg1/lighttpd/lighttpd.exe  -D -f _lighttpd.conf.win

elif [ -f /usr/sbin/lighttpd  ]; then
    echo "linux"
    /usr/sbin/lighttpd  -D -f _lighttpd.conf
else
    echo "lighttps not found!!!"
fi
