#define ROWS_COUNT 2
#define COLS_COUNT 2

#define TIME_DEBOUNCE 15

// Functions

int get_button_pressed();
void fsm();


int ROWS[ROWS_COUNT] = {2,3}, COLS[COLS_COUNT] = {11,12};

void debug(int pos){
  if (pos >= 0) {
    Serial.flush();
    Serial.println(String(pos));
  }
  
}


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
  pinMode(8,OUTPUT); 
  digitalWrite(8,LOW);
  
  Serial.begin(9600);
  Serial.println(String("Setup done"));
  
  
}


void loop(){

  
  fsm();
  delay(TIME_DEBOUNCE*10);
  
}


int get_button_pressed() {
  for(int C = 0; C < COLS_COUNT; C++){
    digitalWrite(COLS[C],0);
    for(int R = 0; R < ROWS_COUNT; R++){
     
      
      int readb = digitalRead(ROWS[R]);
      
      
      if(!readb) {
        while(!digitalRead(ROWS[R])); // wait till unpressed
        digitalWrite(COLS[C],1);
        return C*ROWS_COUNT + R;
      }
      delay(TIME_DEBOUNCE);
      
    }
    digitalWrite(COLS[C],1);
    
  }
  return -1;
  
}

void send_move(int init_pos, int end_pos) {
  Serial.println(String("BEGIN: ")+String(init_pos));
  Serial.println(String("END: ")+String(end_pos));
  //Serial.flush();
  
}

void turn_led_on() {
  digitalWrite(8,HIGH);
}

void turn_led_off() {
  digitalWrite(8,LOW);
}

void fsm() {
  int init_pos = -1;
  int end_pos = -1;
  
  
  while(init_pos == -1) init_pos = get_button_pressed();
  debug(init_pos);
  // Turn on led since there is a movement in course
  turn_led_on();
  while(end_pos == -1 || end_pos == init_pos) end_pos = get_button_pressed();
  debug(end_pos);
  // Turn off led and send completed m
  turn_led_off();
  send_move(init_pos, end_pos);
}
