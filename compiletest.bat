tsc -v ^
& node src/main.js -indir=./test/testmsg -outdir=./test/output -target=ts ^
& tsc -t esnext -m nodenext --removeComments --skipLibCheck ./test/test.ts ^
& pause ^