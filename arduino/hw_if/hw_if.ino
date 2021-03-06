#define ROWS_COUNT 2
#define COLS_COUNT 8
#define TIME_DEBOUNCE 15

#define LED_GREEN 3
#define LED_RED 2

// Functions

int get_button_pressed();

int COLS[COLS_COUNT] = {6,7,8,9,10,11,12,13}, ROWS[ROWS_COUNT] = {4,5};//,12};


void setup(){
  
  // matrix setup
  for(int R = 0; R < ROWS_COUNT; R++){
    pinMode(ROWS[R],INPUT_PULLUP);
  }
  for(int C = 0; C < COLS_COUNT; C++){
    pinMode(COLS[C],OUTPUT);
    digitalWrite(COLS[C],1);
  }
  
  // led setup
  pinMode(2,OUTPUT); 
  digitalWrite(2,LOW);
  pinMode(3,OUTPUT); 
  digitalWrite(3,LOW);
  
  Serial.begin(9600);
  Serial1.begin(9600);
  Serial1.println(String("Setup done"));
  
}


void loop(){

  int square_pos = get_button_pressed();
  if (square_pos != -1) {
    //serial_flush_buffer();
    send_square(square_pos);
    int ack=get_ack();
    light_led(ack);
    delay(TIME_DEBOUNCE*10);
  }
  
}


void serial_flush_buffer()
{
  while (Serial.read() >= 0)
   ; // do nothing
}


void light_led(int ack){
  switch(ack){
    case 0:
      turn_led_off(LED_RED);
      turn_led_on(LED_GREEN);
      break;
    case 1:
      turn_led_off(LED_GREEN);
      turn_led_on(LED_RED);
      break;
    case 2:
      turn_led_off(LED_GREEN);
      turn_led_off(LED_RED);
      break;
  }
}


int get_ack(){
  int ack = -1;
  while(Serial.available() == 0){;}
    ack=Serial.read();
    Serial1.println("Ack received: ");
    Serial1.println(String(ack));
    //Serial.flush();
    
  return ack;
}



int get_button_pressed() {
  for(int C = 0; C < COLS_COUNT; C++){
    digitalWrite(COLS[C],0);
    for(int R = 0; R < ROWS_COUNT; R++){
     
      
      int readb = digitalRead(ROWS[R]);
      
      
      if(!readb) {
        while(!digitalRead(ROWS[R])); // wait till unpressed
        digitalWrite(COLS[C],1);
        return C*8 + R;
      }
      delay(TIME_DEBOUNCE);
      
    }
    digitalWrite(COLS[C],1);
    
  }
  return -1;
  
}

void send_square(int square_pos) {
  Serial.println(square_pos);
  Serial.flush();
}

void turn_led_on(int pin) {
  digitalWrite(pin,HIGH);
}

void turn_led_off(int pin) {
  digitalWrite(pin,LOW);
}
