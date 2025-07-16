#!/bin/bash

# Matar cualquier proceso que use el puerto 3000
echo "Buscando procesos en el puerto 3000..."
PID=$(lsof -ti :3000)
if [ -n "$PID" ]; then
  echo "Matando proceso con PID $PID..."
  kill -9 $PID
else
  echo "No hay procesos usando el puerto 3000."
fi

# Iniciar el servidor
echo "Iniciando server.js..."
node server.js 