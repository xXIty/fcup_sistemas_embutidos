PROJ = 'hw_if'
FQBN = 'arduino:avr:mega'
PORT = '/dev/ttyACM0'

compile:
	arduino-cli compile --fqbn $(FQBN) $(PROJ)

upload:
	arduino-cli upload -p $(PORT) --fqbn $(FQBN) $(PROJ)
