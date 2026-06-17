#include "DHT.h" 
#include "BTree.h"

int main() {
	DHT<int> myDHT;
	int n = -1;
	cout << "Enter number of bits 'n' of identifier space (Space will be of size 2^n ) : ";
	cin >> n;
	myDHT.makeSpace(n);
	myDHT.addMachines(); 

	myDHT.addData(); 
	myDHT.searchRequest(); 
	//this is latest
	return 0;
}