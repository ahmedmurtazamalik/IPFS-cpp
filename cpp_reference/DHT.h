#ifndef  DHT_H
#define DHT_H
#pragma once   
#include "Leastbits.h"
#include "KVP.h"
#include "RT.h"
#include "BTree.h"
#include <iostream> 
//#include <filesystem>
using namespace std;


template <typename T>
class Machine {
public:
	string data;
	T id; // <- this is our KEY
	RT<int>routingTable;
	T* machinesArray;
	Machine* next, * prev;
	bool isOn;
	BTree<int> bt;


	Machine(T x = NULL, int n = 3) {
		id = x; // KEY being assigned to the machine i.e. id being generated
		next = prev = nullptr;
		routingTable.head = nullptr;
		isOn = false;
		bt.order = n;
	}

	void printTable() {
		Node<int>* temp = routingTable.head;
		while (temp != NULL) {
			cout << temp->machine->id << " ";
			temp = temp->next;
		}
	}

	void insertinTree(keyValuePair<int> kvp) {
		bt.Insertion(kvp);
	}

};

template <typename T>
class DHT {
public:
	Machine<T>* head, * tail, * userMachine;
	int idspace, noOfMachines, n; // n:- number of bits, idspace:- identifier space
	T* machinesArray;
	int machinesAdded;
	DHT(int x = 0) {
		srand(time(0));
		head = userMachine = nullptr;
		n = x;
		idspace = noOfMachines = machinesAdded = 0;
		machinesArray = nullptr;
	}

	void insert(T item) {
		if (!head) {
			head = new Machine<T>(item);
			head->next = head;
			head->prev = head;
		}
		else {
			Machine<T>* newNode = new Machine<T>(item);
			Machine<T>* curr = head->prev;
			curr->next = newNode;
			newNode->prev = curr;
			newNode->next = head;
			head->prev = newNode;
		}
	}



	void addData() {

		if (!userMachine)
			setMachine();
		int k;
		cout << "Enter machine in which to add data: ";
		cin >> k;

		string fileString;
		cout << "Enter file content : ";
		cin >> fileString;

		SHA1 obj;
		fileString = obj.from_file(fileString);
		fileString = leastbits(fileString, this->n);

		int key = convertstringtoint(fileString);


		keyValuePair<int> kvp(key, fileString);


		Machine<T>* insertInIt = searchMachine(k);
		insertInIt->insertinTree(kvp);
	}


	void remove(T item) {
		if (head == nullptr) {
			cout << "KHALI LIST" << endl;
			return;
		}

		Machine<T>* curr = head;
		do {
			if (curr->data == item) {
				Machine<T>* prevNode = curr->prev;
				Machine<T>* nextNode = curr->next;

				prevNode->next = nextNode;
				nextNode->prev = prevNode;

				if (curr == head) {
					head = nextNode;
				}

				delete curr;
				return;
			}

			curr = curr->next;
		} while (curr != head);
	}



	void makeSpace(int x) {
		n = x;
		if (x < 0 || x>16)
		{
			cout << "\nInvalid bits\n";
			return;
		}

		idspace = pow(2, n);

		int i = 0;
		T machineID = 0;
		while (i < idspace) {
			insert(machineID++);
			i++;

		}

		T nullval = -1;
		machinesArray = new T[idspace];
		i = 0;
		while (i < idspace) {
			machinesArray[i++] = nullval;
		}

		printSpace();
	}



	void addMachines() {
		if (idspace <= 0)
		{
			cout << "\nNo space\n";
			return;
		}
		int i = 0, idx = 0, idsassigned = 0;
		bool duplicate = false;
		T machineId = NULL;

		cout << "\nEnter number of machines : ";
		cin >> noOfMachines;
		cout << '\n';

		while (noOfMachines > idspace || noOfMachines < 0)
		{
			cout << "Please enter a valid number : ";
			cin >> noOfMachines;
		}

		cout << '\n';
		while (i < noOfMachines)
		{
			cout << "Enter machine to turn on (-1 if you want an automatically assigned machine) [" << i << "] : ";
			cin >> machineId;


			while (machineId < -1 || machineId >= idspace)
			{
				cout << "Please enter a valid number : ";
				cin >> machineId;
			}

			if (machineId == -1) {
				machineId = rand() % idspace + 1;

				idx = 0;


				while (idx < i)
				{
					if (machinesArray[idx] == machineId)
					{
						duplicate = true;
						break;
					}
					idx++;
				}

				while (duplicate)
				{
					duplicate = false;
					machineId = rand() % idspace + 1;

					idx = 0;

					while (idx < i)
					{
						if (machinesArray[idx] == machineId)
						{
							duplicate = true;
							break;
						}
						idx++;
					}
				}


			}

			Machine<T>* currMech = head;
			while (currMech->next && currMech->id != machineId)
				currMech = currMech->next;
			currMech->isOn = true;

			cout << "\nMachine(" << currMech->id << ") is ON\n";
			duplicate = false;
			idx = 0;
			while (idx < i)
			{
				if (machinesArray[idx++] == machineId)
				{
					duplicate = true;
					break;
				}
			}
			if (!duplicate)
			{
				machinesArray[i++] = machineId;
				machinesAdded++;
			}

			cout << '\n';
		}
		updateRoutingTables();
		printSpace();
		return;
	}


	void removeMachine() {
		int machineid;
		cout << "Enter machine to remove : ";
		cin >> machineid;

		while (machineid < 0 || machineid >= idspace)
		{
			cout << "Please enter a valid id : ";
			cin >> machineid;
		}

		Machine<T>* currMech = head;

		do
		{
			currMech = currMech->next;
		} while (currMech != head && currMech->id != machineid);

		if (currMech->isOn)
		{
			currMech->isOn = false;
			int idx = 0;
			while (idx < machinesAdded)
			{
				if (machinesArray[idx] == currMech->id)
				{
					machinesArray[idx] = -1;
					break;
				}
				idx++;
			}
			machinesAdded--;
		}
		else
			cout << "\nMachine is already inactive.\n";
		printSpace();
	}

	void machineJoining() {
		int machineid;
		cout << "Enter machine to add : ";
		cin >> machineid;

		while (machineid < 0 || machineid >= idspace)
		{
			cout << "Please enter a valid id : ";
			cin >> machineid;
		}

		Machine<T>* currMech = head;

		do
		{
			currMech = currMech->next;
		} while (currMech != head && currMech->id != machineid);

		if (!currMech->isOn)
		{
			currMech->isOn = true;
			machinesArray[machinesAdded++] = currMech->id;
			updateRoutingTables();
		}
		else
			cout << "\nMachine is already active\n";
		printSpace();
	}

	void updateRoutingTables() {
		Machine<T>* currNode = head;
		int i = 0;
		bool succFound = false, mechFound = false, entryFound = false;
		T nextKey;
		while (i < noOfMachines) {
			currNode = head;
			while (currNode->next != head && currNode->id != machinesArray[i])
				currNode = currNode->next;
			currNode->routingTable.head = nullptr;
			int a = 0;
			//cout << "Machine : " << currNode->id << "\nRouting Table\n";

			while (a < n) {
				mechFound = succFound = entryFound = false;
				nextKey = currNode->id + pow(2, a);
				nextKey %= idspace;
				Machine<T>* findNode = currNode;
				do {
					if (findNode->isOn)
						succFound = true;
					if (findNode->id == nextKey)
						mechFound = true;
					if (!mechFound && succFound)
						succFound = false;

					if (succFound && mechFound)
					{
						entryFound = true;
						break;
					}
					findNode = findNode->next;
				} while (findNode->next != currNode && !entryFound);

				if (entryFound)
					currNode->routingTable.insertAtEnd(findNode);
				else
					currNode->routingTable.insertAtEnd(currNode);

				a++;
			}

			i++;
		}
	}



	void printSpace() {
		if (head == nullptr) {
			cout << "KHALI LIST" << endl;
			return;
		}
		cout << '\n';
		Machine<T>* curr = head;
		do {
			cout << curr->id;
			if (curr->isOn)
				cout << "(ON)";
			cout << " ";
			curr = curr->next;
		} while (curr != head);
		cout << endl;
		//int machinesAdded = 0;
		int i = 0;
		/*while (i < idspace)
			if (machinesArray[i++] != -1)
				machinesAdded++;*/

		if (machinesAdded != 1)
			cout << '\n' << machinesAdded << " active machines in system\n";
		else
			cout << "\n1 active machine in system\n";
	}

	void printRoutingTables() {
		if (head == nullptr) {
			cout << "KHALI LIST" << endl;
			return;
		}

		Machine<T>* curr = head;
		do {
			cout << curr->id;
			if (curr->isOn) {
				curr->printTable();
			}
			cout << '\n';
			curr = curr->next;
		} while (curr != head);
		cout << '\n';
	}


	void printAny() {
		char choice;

		do {
			T machineid;
			cout << "\nEnter machine id : ";
			cin >> machineid;

			while (machineid < 0 || machineid >= idspace) {
				cout << "Please enter a valid id : ";
				cin >> machineid;
			}

			Machine<T>* currMech = head;

			while (currMech && currMech->id != machineid)
				currMech = currMech->next;

			if (currMech) {
				if (currMech->routingTable.head) {
					currMech->printTable();
					cout << '\n';
				}
				else {
					cout << "This machine does not exist yet.\n";
				}
			}
			else {
				cout << "Machine not found.\n";
			}

			cout << "\nDo you want to print the routing table of another machine? (y/n): ";
			cin >> choice;

		} while (choice == 'y' || choice == 'Y');
	}


	void setMachine() {
		int machineid;
		cout << "\nEnter your machine : ";
		cin >> machineid;

		while (machineid < 0 || machineid >= idspace)
		{
			cout << "Please enter a valid ID (0 - " << idspace - 1 << ") : ";
			cin >> machineid;
		}

		Machine<T>* currMech = head;

		while (currMech && currMech->id != machineid)
			currMech = currMech->next;

		if (currMech)
		{
			userMachine = currMech;
			cout << "\nYour machine is " << userMachine->id << '\n';
		}
		else
			cout << "\nThis machine does not exist yet\n";
		return;
	}


	void searchKey() {
		int k;
		if (!userMachine)
			setMachine();
		cout << "\nEnter key to search : ";
		cin >> k;

		Machine<T>* keyinMech = searchMachine(k);
		if (keyinMech)
			cout << "\nYour key is in Machine(" << keyinMech->id << ")\n";
		else
			cout << "\nKey is not in this system\n";
	}

	void insertFile() {
	}

	Machine<T>* searchMachine(int k) {
		if (!userMachine)
			setMachine();
		Machine<T>* currMech = userMachine;
		Node<T>* entrymech = nullptr;
		bool mechFound = false;
		do {
			mechFound = false;
			if (currMech->id == k)
			{
				mechFound = true;
				return currMech;
			}

			else if (currMech->id < k && k <= currMech->routingTable.head->machine->id)
			{
				currMech = currMech->routingTable.head->machine;
				continue;
			}
			else
			{
				entrymech = currMech->routingTable.head;

				while (entrymech->next)
				{
					if (entrymech->machine->id < k && k <= entrymech->next->machine->id)
					{
						currMech = entrymech->machine;
						mechFound = true;
						break;
					}
					entrymech = entrymech->next;
				}

				if (currMech->id < entrymech->machine->id)
				{
					currMech = entrymech->machine;
					continue;
				}

				else if (mechFound)
				{
					mechFound = false;
					continue;
				}


			}
			return currMech;

		} while (currMech != userMachine && !mechFound);

		return nullptr;
	}

	void searchRequest() {
		string fileString;
		int k;
		if (!userMachine)
			setMachine();
		cout << "\nEnter machine from which to request data : ";
		cin >> k;

		Machine<T>* keyinMech = searchMachine(k);

		if (!keyinMech)
		{
			cout << "\nKey is not in this system\n";
			return;
		}

		cout << "\nYour key is in machine (" << keyinMech->id << ")\n";

		cout << "Enter file to search : ";
		cin >> fileString;



		SHA1 obj;
		fileString = obj.from_file(fileString);
		fileString = leastbits(fileString, this->n);

		int key = convertstringtoint(fileString);




		keyValuePair<T> kvp(key, fileString);

		keyinMech->bt.search(kvp);
	}

};

#endif // ! DHT_H


//int main() {
//	LL<int> list;
//
//	list.insert(1);
//	list.insert(2);
//	list.insert(3);
//	list.insert(4);
//	list.insert(5);
//	list.insert(534634);
//	list.insert(23);
//	list.insert(25);
//	list.print();
//	list.remove(23);
//	list.print();
//
//
//	return 0;
//}