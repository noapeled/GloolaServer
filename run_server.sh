#!/bin/sh

CHECK_PERIOD_SECONDS=10

log() {
	message="$1"
	echo '['`date`'] '"$message" | tee -a ./update_server.log
}

get_server_pid() {
    server_pid=`ps -ef | grep 'serverMain' | grep -v grep | awk '{print $2}'`
}

run_node_server() {
    npm install
    node -e 'require("./server").serverMain("demoDb", "./access.log")' &
}

# Run server if not already running.
get_server_pid
if [ "$server_pid" = "" ] ; then
	run_node_server
	log 'No running server found, so started server'
fi

while [ 1 ] ; do
	cd ~/GloolaServer

	# Check if there are remote changes which need to be pulled.
	git fetch origin
	reslog=$(git log HEAD..origin/master --oneline)
	if [ "$reslog" != "" ] ; then
		log "Found new git log ($reslog), updating."
		# Pull and restart server.
  		git merge origin/master # completing the pull
		get_server_pid
		kill -9 "$server_pid"
		run_node_server
		log 'Code changes pulled and server restarted'
	else
		log 'No code changes detected, server not restarted.'
	fi
	sleep "$CHECK_PERIOD_SECONDS"
done
