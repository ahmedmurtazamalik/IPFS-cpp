#pragma once  
#include <iostream> 
using namespace std; 

template <typename T>
class Machine;

template <typename T>
class Node {
public:
    Machine<T>* machine;
    Node<T>* prev;
    Node<T>* next;

    // Constructor
    Node(Machine<T>* machine, Node<T>* prev = nullptr, Node<T>* next = nullptr)
        : machine(machine), prev(prev), next(next) {}
};

template <typename T>
class RT {
public:
    Node<T>* head;
    Node<T>* tail;

    // Constructor
    RT() : head(nullptr), tail(nullptr) {}

    // Destructor to free memory when the list is destroyed
    ~RT() {
        clear();
    }

    // Function to insert a Machine at the end of the list
    void insertAtEnd(Machine<T>* machine) {
        Node<T>* newNode = new Node<T>(machine);

        if (!head) {
            // If the list is empty, set both head and tail to the new node
            head = tail = newNode;
        }
        else {
            // Otherwise, update the next pointer of the current tail and the prev pointer of the new node
            tail->next = newNode;
            newNode->prev = tail;
            // Update the tail to the new node
            tail = newNode;
        }
    }

    // Function to display the elements of the list
    void display() const { 
        cout << '\t';
        Node<T>* current = head;
        while (current) {
            current->machine->display();
            cout << " ";
            current = current->next;
        }
        cout << '\n';
    }

    // Function to clear the list and free memory
    void clear() {
        Node<T>* current = head;
        while (current) {
            Node<T>* nextNode = current->next;
            delete current;
            current = nextNode;
        }
        head = tail = nullptr;
    }
};
