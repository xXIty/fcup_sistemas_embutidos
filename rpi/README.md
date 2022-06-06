# Raspberry Pi 3 insights

This part of the system is in charge of three key components of the project. These components are:
- Progressive Web App for phone devices.
- Chess game maintenance.
- Chess engine for game evaluation.

These components are executed concurrently. 

## Memory management
The three components mentioned previously use the same data to 

## Interconnections
The Raspberry Pi 3 communicates with other devices bia two main channels. These channels are a Universal Asynchronous Receiver/Transmitter, or UART from here on, and an http service providing a Progressive Web Application, or PWA from here on, to a phone device (Arduino, Apple, etc.).

## Inter process communication

## Memory management
acting as the single source of truth (SSOT) of all the information that the system produces.

### Arduino
Comunication with Arduino via .

# Configuration for dev
## SSH login
- user: user
- password: raspberry

## Network
static ip: 192.168.33.10
