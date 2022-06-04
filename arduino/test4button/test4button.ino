#define ROWS_COUNT 2
#define COLS_COUNT 1

#define TIME_DEBOUNCE 15

// Functions

int get_button_pressed();


int ROWS[ROWS_COUNT] = {2,3}, COLS[COLS_COUNT] = {11};//,12};


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

  
  int square_pos = get_button_pressed();
  if (square_pos != -1)
    send_square(square_pos);
    
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

void send_square(int square_pos) {
  Serial.println(square_pos);
  Serial.flush();
}

void turn_led_on() {
  digitalWrite(8,HIGH);
}

void turn_led_off() {
  digitalWrite(8,LOW);
}
