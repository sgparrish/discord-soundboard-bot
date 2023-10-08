curl $VOSK_MODEL_URL -o ./model.zip
unzip ./model.zip -d ./data/model
directory=$(find ./data/model -name README | xargs dirname)
mv $directory/* ./data/model
rm $directory

echo "Vosk setup complete"