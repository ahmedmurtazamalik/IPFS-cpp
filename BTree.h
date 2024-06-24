#pragma once
#include <iostream>
#include <string>
#include <fstream>
#include "LinkedList.h"
#include "KVP.h"

using namespace std;

//string* filePaths;

template <typename T>
class BTreeNode
{
public:

	keyValuePair<T>* pairs;
	//SLinkedList<string>* path;
	//SLinkedList<int>* line;
	BTreeNode<T>** children;
	bool leaf;
	int noOfKeys;
	int order;
	int type;

	BTreeNode(int order=3, bool leaf=false)
	{
		this->order = order;
		this->leaf = leaf;

		pairs = new keyValuePair<T>[order - 1];
		//path = new SLinkedList<string>[order - 1];
		//line = new SLinkedList<int>[order - 1];
		children = new BTreeNode<T>*[order];

		noOfKeys = 0;
	}

	int getKeys()
	{
		return noOfKeys;
	}

	//=============================================================================================//
	//-----------------------------------------TRAVERSAL-------------------------------------------//
	//=============================================================================================//

	void traverse()
	{
		int i = 0;

		// Since there are n keys and n+1 children, we first traverse through n keys and children
		while (i < noOfKeys)
		{
			if (!leaf)
			{
				children[i]->traverse();
			}
			cout << " " << pairs[i].key;
			i++;
		}

		// Traverse the last child
		if (!leaf)
			children[i]->traverse();
	}

	void clear()
	{
		int i = 0;

		// Since there are n keys and n+1 children, we first traverse through n keys and children
		while (i < noOfKeys)
		{
			if (!leaf)
			{
				children[i]->clear();
			}
			noOfKeys = 0;
			i++;
		}

		// Traverse the last child
		if (!leaf)
			children[i]->clear();
	}

	void setType(int type)
	{
		int i = 0;

		// Since there are n keys and n+1 children, we first traverse through n keys and children
		while (i < noOfKeys)
		{
			if (!leaf)
			{
				children[i]->setType(type);
			}
			this->type = type;
			i++;
		}

		// Traverse the last child
		if (!leaf)
			children[i]->setType(type);
	}

	void writeToFile(string fileName, string write)
	{
		int i = 0;

		// Since there are n keys and n+1 children, we first traverse through n keys and children
		while (i < noOfKeys)
		{
			if (!leaf)
			{
				write += "\t";
				children[i]->traverse();
			}
			cout << " " << pairs[i].key;
			write += pairs[i].key;
			i++;
		}

		// Traverse the last child
		if (!leaf)
		{
			write += "\t";
			children[i]->traverse();
		}

		ofstream myFile(fileName);

		myFile << write;

		myFile.close();

	}

	//=============================================================================================//
	//------------------------------------------SEARCH---------------------------------------------//
	//=============================================================================================//

	// Function to search key k in subtree rooted with this node
	void search(keyValuePair<T> data)
	{
		int i = 0;

		// Since there are n keys and n+1 children, we first traverse through n keys and children
		while (i < noOfKeys)
		{
			if (!leaf)
			{
				children[i]->search(data);
			}

			if (pairs[i] == data)
			{
				cout << "Key: " << pairs[i].key << endl;
				//cout << "Path: " << path->getData(i) << endl;
				//cout << "Line: " << line->getData(i) << endl;

				//ifstream file;
				//string str;

				//file.open(path->getData(i));

				//if (!file)
				//{
				//	cout << "File not found" << endl;
				//	//return;
				//}

				//int counter = 1;

				//while (getline(file, str))
				//{

				//	if (counter == line->getData(i))
				//	{
				//		cout << str << endl;
				//		break;
				//	}

				//	counter++;

				//}

				//file.close();
			}
			i++;
		}

		// Traverse the last child
		if (!leaf)
			children[i]->search(data);
	}


	//=============================================================================================//
	//-----------------------------------------INSERTION-------------------------------------------//
	//=============================================================================================//

	void splitChild(int placement, BTreeNode<T>* splitNode)
	{
		BTreeNode<T>* newNode = new BTreeNode<T>(splitNode->order, splitNode->leaf);
		int minKeys = (order / 2) - 1;
		newNode->noOfKeys = minKeys;

		for (int x = 0; x < minKeys; x++)
		{																// (order / 2) is min number of children
			newNode->pairs[x] = splitNode->pairs[minKeys + 1 + x]; 	// Supposed to be y->keys[(order / 2)] but since division is costly, I reused minKeys variable 
			//newNode->path->InsertAtIndex(splitNode->path->getData(minKeys + 1 + x), x);
			//newNode->line->InsertAtIndex(splitNode->line->getData(minKeys + 1 + x), x);
		}

		if (!splitNode->leaf)
		{
			for (int x = 0; x < minKeys + 1; x++)
			{
				newNode->children[x] = splitNode->children[minKeys + 1 + x];
			}
		}

		// The right half of splitNode has been chopped off, it now has the least amount of keys possible
		splitNode->noOfKeys = minKeys;

		// Creating space for new child
		for (int x = noOfKeys; x >= placement + 1; x--)
		{
			children[x + 1] = children[x];
		}

		// Add new child
		children[placement + 1] = newNode;

		for (int x = noOfKeys - 1; x >= placement; x--) // For keys[0] noOfKeys is 1, so we use noOfKeys - 1
		{
			pairs[x + 1] = pairs[x]; 
			//path->InsertAtIndex(path->getData(x), x + 1);
			//line->InsertAtIndex(line->getData(x), x + 1);
		}

		// Add middle key of child to this node
		pairs[placement] = splitNode->pairs[minKeys];
		//path->InsertAtIndex(splitNode->path->getData(minKeys), placement);
		//line->InsertAtIndex(splitNode->line->getData(minKeys), placement);
		noOfKeys++;

	}

	void insertUnfilled(keyValuePair<T> data)
	{
		int i = noOfKeys - 1;

		if (leaf)
		{
			// Find location of key to be inserted and make place for it
			while (i >= 0 && pairs[i] > data)
			{
				pairs[i + 1] = pairs[i];
			//	path->InsertAtIndex(path->getData(i), i + 1);
			//	line->InsertAtIndex(line->getData(i), i + 1);
				i--;
			}

			i++; // Get index back to correct place
			pairs[i] = data;
			//path->InsertAtIndex(filePath, i);
			//line->InsertAtIndex(lineNumber, i);
			noOfKeys++;
		}
		else
		{
			while (i >= 0 && pairs[i] > data)
			{
				i--;
			}

			i++;

			// if child is full
			if (children[i]->noOfKeys == order - 1)
			{
				splitChild(i, children[i]);

				if (pairs[i] < data)
					i++;
			}
			children[i]->insertUnfilled(data);
		}
	}

	//=============================================================================================//
	//------------------------------------------DELETION-------------------------------------------//
	//=============================================================================================//

	int findKey(keyValuePair<T> data) // Find key that is greater or equal to data
	{
		int i = 0;

		while (i < noOfKeys && pairs[i] < data)
			i++;

		return i;
	}

	void removeFromLeafNode(int i)
	{
		for (int x = i + 1; x < noOfKeys; x++) // Move all keys after position i backwards by one place
		{
			pairs[x - 1] = pairs[x];
			//path->InsertAtIndex(path->getData(x), x - 1);
			//line->InsertAtIndex(line->getData(x), x - 1);
		}

		noOfKeys--;
		return;
	}

	T prevKey(int i)
	{
		BTreeNode<T>* currentNode = children[i];

		while (!currentNode->leaf)	// Keep moving right most until a leaf is reached
		{
			currentNode = currentNode->children[currentNode->noOfKeys];
		}

		return currentNode->pairs[currentNode->noOfKeys - 1]; // return the last key of leaf (For key[0] number of keys is 1, so we use noOfKeys - 1)
	}

	T nextKey(int i)
	{
		BTreeNode<T>* currentNode = children[i + 1];

		while (!currentNode->leaf)
		{
			currentNode = currentNode->children[0];
		}

		return currentNode->pairs[0];
	}

	void removeFromNonLeafNode(int i)
	{
		T  k = pairs[i];

		int minKeysBeforeDelete = (order / 2);

		// If children[i] (left sibling) has atleast (order / 2) keys,
		// find the key previous to k in the subtree rooted at children[i], replace with k and delete previous key from child
		if (children[i]->noOfKeys >= minKeysBeforeDelete)
		{
			T previous = prevKey(i);
			pairs[i] = previous;
			children[i]->deleteKey(previous);
		}
		else if (children[i + 1]->noOfKeys >= minKeysBeforeDelete) // Else check children[i+1] (right sibling) and perform the same opertion with the key next to k
		{
			T next = nextKey(i);
			pairs[i] = next;
			children[i + 1]->deleteKey(next);
		}
		else // If both left and right siblings have less than (order / 2) keys, merge left sibling, k and right sibling and delete k
		{
			merge(i);
			children[i]->deleteKey(k);
		}
		return;
	}

	void takeFromLeftSibling(int i)
	{
		BTreeNode<T>* child = children[i];
		BTreeNode<T>* sibling = children[i - 1];

		// Last key from left sibling goes to parent and key[i - 1] (key before right child) goes from parent to right child

		// Move all keys in right child one place forward
		for (int x = child->noOfKeys - 1; x >= 0; i--)	// For key[0] noOfKeys is 1, so we use noOfKeys - 1
		{
			child->pairs[x + 1] = child->pairs[x];
			//child->path->InsertAtIndex(child->path->getData(x), x + 1);
			//child->line->InsertAtIndex(child->line->getData(x), x + 1);
		}

		// if right child is not leaf, move all its pointers one place forward
		if (!child->leaf)
		{
			for (int i = child->noOfKeys; i >= 0; i--)
			{
				child->children[i + 1] = child->children[i];
			}
		}

		// Set the key in right child
		child->pairs[0] = pairs[i - 1];
		//child->path->InsertAtIndex(path->getData(i - 1), 0);
		//child->line->InsertAtIndex(line->getData(i - 1), 0);

		// Make sibling's (left child) last child right child's first child 
		if (!child->leaf)
		{
			child->children[0] = sibling->children[sibling->noOfKeys];
		}

		// Move key from left child to parent
		pairs[i - 1] = sibling->pairs[sibling->noOfKeys - 1];
		//path->InsertAtIndex(sibling->path->getData(sibling->noOfKeys - 1), i - 1);
		//line->InsertAtIndex(sibling->line->getData(sibling->noOfKeys - 1), i - 1);

		child->noOfKeys++;
		sibling->noOfKeys--;
		return;
	}

	void takeFromRightSibling(int i)
	{
		BTreeNode<T>* child = children[i];
		BTreeNode<T>* sibling = children[i + 1];

		// Insert key from parent in left child
		child->pairs[child->noOfKeys] = pairs[i];

		// Make sibling's (right child) first child left child's last child
		if (!child->leaf)
		{
			child->children[child->noOfKeys + 1] = sibling->children[0];
		}

		// Key from right child is moved to parent
		pairs[i] = sibling->pairs[0];
		//path->InsertAtIndex(sibling->path->getData(0), i);
		//line->InsertAtIndex(sibling->line->getData(0), i);

		// Move all keys in sibling (right child) one place backwards
		for (int x = 1; x < sibling->noOfKeys; x++)
		{
			sibling->pairs[x - 1] = sibling->pairs[x];
			//sibling->path->InsertAtIndex(sibling->path->getData(x), x - 1);
			//sibling->line->InsertAtIndex(sibling->line->getData(x), x - 1);
		}

		// Move child pointers in sibling (right child) one place backwards
		if (!sibling->leaf)
		{
			for (int x = 1; x <= sibling->noOfKeys; x++)
			{
				sibling->children[x - 1] = sibling->children[x];
			}
		}

		child->noOfKeys++;
		sibling->noOfKeys--;
		return;
	}

	void merge(int i)
	{
		BTreeNode<T>* child = children[i];
		BTreeNode<T>* sibling = children[i + 1];
		int minKeys = (order / 2) - 1;

		// Insert a key from parent to child
		child->pairs[minKeys] = pairs[i]; // Code Check
		//child->path->InsertAtIndex(path->getData(i), minKeys);
		//child->line->InsertAtIndex(line->getData(i), minKeys);

		// Adding right child's keys to left child
		for (int x = 0; x < sibling->noOfKeys; x++)
		{
			child->pairs[minKeys + x + 1] = sibling->pairs[x]; // Code Check
			//child->path->InsertAtIndex(sibling->path->getData(x), minKeys + x + 1);
			//child->line->InsertAtIndex(sibling->line->getData(x), minKeys + x + 1);
		}

		// Adding right child's children to left child
		if (!child->leaf)
		{
			for (int x = 0; x <= sibling->noOfKeys; x++)
			{
				child->children[minKeys + x + 1] = sibling->children[x]; // Code Check
			}
		}

		// Moving keys in current node one step backwards
		for (int x = i + 1; x < noOfKeys; x++)
		{
			pairs[x - 1] = pairs[x];
			//path->InsertAtIndex(path->getData(x), x - 1);
			//line->InsertAtIndex(line->getData(x), x - 1);
		}

		// Moving children in current node one step backwards
		for (int x = i + 2; x <= noOfKeys; x++)
		{
			children[i - 1] = children[i];
		}

		// Child now has all of sibling's keys and one key from parent
		child->noOfKeys += sibling->noOfKeys + 1;
		noOfKeys--;

		// Delete sibling node
		delete(sibling);
		return;
	}

	void fillChild(int i) // fill child that has less than (order / 2) - 1 keys
	{
		int minKeysBeforeTake = order / 2;

		// If left sibling has more than (order / 2) - 1 keys, take a key from it
		if (i != 0 && children[i - 1]->getKeys() >= minKeysBeforeTake)
		{
			takeFromLeftSibling(i);
		}
		else if (i != noOfKeys && children[i + 1]->getKeys() >= minKeysBeforeTake) // Else check right sibling and perform the same operation
		{
			takeFromRightSibling(i);
		}
		else // Else merge children[i] with sibling
		{
			if (i != noOfKeys)
			{
				merge(i);
			}
			else
			{
				merge(i - 1);
			}
		}
		return;
	}

	bool updateKeyInt(keyValuePair<T> data)
	{
		int i = findKey(data);

		if (i < noOfKeys && pairs[i] == data)
		{
			cout << "\nkee found hehe\n";
			//string id, year, cause113, cause, state, deaths, ageDeath;

			//cout << "Enter ID: " << id;
			//cin >> id;
			//cout << "Enter Year: " << year;
			//cin >> year;
			//cout << "Enter 113 Cause: " << cause113;
			//cin >> cause113;
			//cout << "Enter Cause: " << cause;
			//cin >> cause;
			//cout << "Enter State: " << state;
			//cin >> state;
			//cout << "Enter Deaths: " << deaths;
			//cin >> deaths;
			//cout << "Enter Age-Related Death Rate: " << ageDeath;
			//cin >> ageDeath;

			//string finalString = id + ',' + year + ',' + cause113 + ',' + cause + ',' + state + ',' + deaths + ',' + ageDeath;

			//ifstream file;
			////string p = path->getData(i);
			////cout << "FILE PATH IS: " << path->getData(i) << endl;
			//file.open(p);

			////cout << endl << endl << "TYPE IS: " << this->type << endl << endl;

			//string str;
			//string store;
			//string temp;

			//int counter = 1;
			//int commas = 0;

			//bool skip = false;
			//bool readComma = true;

			//if (!file)
			//{
			//	cout << "File not found!" << endl;
			//	return;
			//}

			//while (getline(file, str))
			//{
			//	skip = false;
			//	commas = 0;

			//	if (counter != 1)
			//	{
			//		for (int x = 0; x < str.length(); x++)
			//		{

			//			if (str[x] == '\"' && readComma)
			//			{
			//				readComma = false;
			//				continue;
			//			}
			//			else if (str[x] == '\"' && !readComma)
			//			{
			//				readComma = true;
			//				continue;
			//			}

			//			if (str[x] == ',' && readComma)
			//			{
			//				commas++;

			//				if (commas != this->type)
			//				{
			//					temp.clear();
			//					continue;
			//				}
			//				else if (commas == this->type)
			//				{
			//					if (stoi(temp) == data)
			//					{
			//						skip = true;
			//						break;
			//					}
			//					break;
			//				}

			//				break;
			//			}

			//			temp += str[x];
			//		}
			//	}

			//	temp.clear();

			//	if (!skip)
			//	{
			//		store += str;
			//		store += "\n";
			//	}
			//	else if (skip)
			//	{
			//		store += finalString;
			//		store += "\n";
			//	}

			//	counter++;
			//}

			//file.close();

			//ofstream outFile;
			//outFile.open(p);

			//outFile << store;

			//outFile.close();
		}
		else
		{
			if (leaf) // If this leaf is node, then key does not exist in the tree
			{
				cout << "Error: The key " << data << " does not exist in this tree" << endl;
				return;
			}

			// The key to be removed is present in the sub-tree of this node

			bool keyInLastChild;

			// Check if key is in the sub-tree rooted with the last child of this node
			if (i == noOfKeys)
				keyInLastChild = true;
			else
				keyInLastChild = false;

			// If key is in last child then it must have merged with previous child
			if (keyInLastChild && i > noOfKeys) // Here i can be greater than noOfKeys as after merging in fill() func, noOfKeys can be changed/reduced
			{
				children[i - 1]->updateKeyInt(data);
			}
			else
			{
				children[i]->updateKeyInt(data);
			}
		}

	}

	//void updateKeyString(keyValuePair<T> data)
	//{
	//	int i = findKey(data);

	//	if (i < noOfKeys && pairs[i].key == data)
	//	{
	//		string id, year, cause113, cause, state, deaths, ageDeath;

	//		cout << "Enter ID: " << id;
	//		cin >> id;
	//		cout << "Enter Year: " << year;
	//		cin >> year;
	//		cout << "Enter 113 Cause: " << cause113;
	//		cin >> cause113;
	//		cout << "Enter Cause: " << cause;
	//		cin >> cause;
	//		cout << "Enter State: " << state;
	//		cin >> state;
	//		cout << "Enter Deaths: " << deaths;
	//		cin >> deaths;
	//		cout << "Enter Age-Related Death Rate: " << ageDeath;
	//		cin >> ageDeath;

	//		string finalString = id + ',' + year + ',' + cause113 + ',' + cause + ',' + state + ',' + deaths + ',' + ageDeath;

	//		//ifstream file;
	//		//string p = path->getData(i);
	//		//cout << "FILE PATH IS: " << path->getData(i) << endl;
	//		//file.open(p);

	//		//cout << endl << endl << "TYPE IS: " << this->type << endl << endl;

	//		string str;
	//		string store;
	//		string temp;

	//		int counter = 1;
	//		int commas = 0;

	//		bool skip = false;
	//		bool readComma = true;

	//		if (!file)
	//		{
	//			cout << "File not found!" << endl;
	//			return;
	//		}

	//		while (getline(file, str))
	//		{
	//			skip = false;
	//			commas = 0;

	//			if (counter != 1)
	//			{
	//				for (int x = 0; x < str.length(); x++)
	//				{

	//					if (str[x] == '\"' && readComma)
	//					{
	//						readComma = false;
	//						continue;
	//					}
	//					else if (str[x] == '\"' && !readComma)
	//					{
	//						readComma = true;
	//						continue;
	//					}

	//					if (str[x] == ',' && readComma)
	//					{
	//						commas++;

	//						if (commas != this->type)
	//						{
	//							temp.clear();
	//							continue;
	//						}
	//						else if (commas == this->type)
	//						{
	//							if (temp == data)
	//							{
	//								skip = true;
	//								break;
	//							}
	//							break;
	//						}

	//						break;
	//					}

	//					temp += str[x];
	//				}
	//			}

	//			temp.clear();

	//			if (!skip)
	//			{
	//				store += str;
	//				store += "\n";
	//			}
	//			else if (skip)
	//			{
	//				store += finalString;
	//				store += "\n";
	//			}

	//			counter++;
	//		}

	//		file.close();

	//		ofstream outFile;
	//		outFile.open(p);

	//		outFile << store;

	//		outFile.close();
	//	}
	//	else
	//	{
	//		if (leaf) // If this leaf is node, then key does not exist in the tree
	//		{
	//			cout << "Error: The key " << data << " does not exist in this tree" << endl;
	//			return;
	//		}

	//		// The key to be removed is present in the sub-tree of this node

	//		bool keyInLastChild;

	//		// Check if key is in the sub-tree rooted with the last child of this node
	//		if (i == noOfKeys)
	//			keyInLastChild = true;
	//		else
	//			keyInLastChild = false;

	//		// If key is in last child then it must have merged with previous child
	//		if (keyInLastChild && i > noOfKeys) // Here i can be greater than noOfKeys as after merging in fill() func, noOfKeys can be changed/reduced
	//		{
	//			children[i - 1]->updateKeyString(data);
	//		}
	//		else
	//		{
	//			children[i]->updateKeyString(data);
	//		}
	//	}
	//}

	//bool deleteKey(T data)	// Restructuring the tree before deletion, then deleting
	//{
	//	int i = findKey(data);

	//	// The key is present in this node
	//	if (i < noOfKeys && pairs[i].key == data)
	//	{
	//		//ifstream file;
	//		//string p = path->getData(i);
	//		////cout << "FILE PATH IS: " << path->getData(i) << endl;
	//		//file.open(p);

	//		////cout << endl << endl << "TYPE IS: " << this->type << endl << endl;

	//		//string str;
	//		//string store;
	//		//string temp;

	//		//int counter = 1;
	//		//int commas = 0;

	//		//bool skip = false;
	//		//bool readComma = true;

	//		//if (!file)
	//		//{
	//		//	cout << "File not found!" << endl;
	//		//	return false;
	//		//}

	//		//while (getline(file, str))
	//		//{
	//		//	skip = false;
	//		//	commas = 0;

	//		//	if (counter != 1)
	//		//	{
	//		//		for (int x = 0; x < str.length(); x++)
	//		//		{

	//		//			if (str[x] == '\"' && readComma)
	//		//			{
	//		//				readComma = false;
	//		//				continue;
	//		//			}
	//		//			else if (str[x] == '\"' && !readComma)
	//		//			{
	//		//				readComma = true;
	//		//				continue;
	//		//			}

	//		//			if (str[x] == ',' && readComma)
	//		//			{
	//		//				commas++;

	//		//				if (commas != this->type)
	//		//				{
	//		//					temp.clear();
	//		//					continue;
	//		//				}
	//		//				else if (commas == this->type)
	//		//				{
	//		//					if (stoi(temp) == data)
	//		//					{
	//		//						skip = true;
	//		//						break;
	//		//					}
	//		//					break;
	//		//				}

	//		//				break;
	//		//			}

	//		//			temp += str[x];
	//		//		}
	//		//	}

	//		//	temp.clear();

	//		//	if (!skip)
	//		//	{
	//		//		store += str;
	//		//		store += "\n";
	//		//	}

	//		//	counter++;
	//		//}

	//		//file.close();

	//		////cout << endl << endl << "Store has: " << endl << endl;
	//		////cout << store << endl;

	//		//ofstream outFile;
	//		//outFile.open(p);
	//		//
	//		//outFile << store;

	//		//outFile.close();

	//		// This node is leaf node or not
	//		if (leaf)
	//		{
	//			removeFromLeafNode(i);
	//			return true;
	//		}
	//		else
	//		{
	//			removeFromNonLeafNode(i);
	//			return true;
	//		}
	//	}
	//	else
	//	{
	//		if (leaf) // If this leaf is node, then key does not exist in the tree
	//		{
	//			//cout << "Error: The key " << data << " does not exist in this tree" << endl;
	//			return false;
	//		}

	//		// The key to be removed is present in the sub-tree of this node

	//		bool keyInLastChild;

	//		// Check if key is in the sub-tree rooted with the last child of this node
	//		if (i == noOfKeys)
	//			keyInLastChild = true;
	//		else
	//			keyInLastChild = false;

	//		// If the child where key is supposed to exist has less than (order / 2) keys
	//		// Fill that child
	//		if (children[i]->noOfKeys < (order / 2) - 1)
	//		{
	//			fillChild(i);
	//		}

	//		// If key is in last child then it must have merged with previous child
	//		if (keyInLastChild && i > noOfKeys) // Here i can be greater than noOfKeys as after merging in fill() func, noOfKeys can be changed/reduced
	//		{
	//			children[i - 1]->deleteKey(data);
	//		}
	//		else
	//		{
	//			children[i]->deleteKey(data);
	//		}

	//	}

	//}

};

template <typename T>
class BTree
{
	BTreeNode<T>* root;
public:
	int order;
	int type;


	BTree(int order=3)
	{
		root = nullptr;
		this->order = order;
	}

	void traverse()
	{
		if (root == nullptr)
			return;
		else
			root->traverse();
	}

	void clear()
	{
		if (root == nullptr)
			return;
		else
			root->clear();
	}

	void setType(int type)
	{
		if (root == nullptr)
			return;
		else
			root->setType(type);
	}

	void writeToFile(string fileName)
	{
		if (root == nullptr)
			return;

		string write = "";
		root->writeToFile(fileName, write);
	}

	void Insertion(keyValuePair<T> data)
	{
		if (root == nullptr)
		{
			root = new BTreeNode<T>(order, true);
			root->pairs[0] = data;
			//root->path->insert(filePath);
			//root->line->insert(lineNumber);
			root->noOfKeys++;
		}
		else
		{
			if (root->noOfKeys == order - 1)
			{
				// Create new root
				BTreeNode<T>* newNode = new BTreeNode<T>(order, false);

				// Make current root child of new root
				newNode->children[0] = root;

				// Split old root and move a key to new root
				newNode->splitChild(0, root);

				int i = 0;
				if (newNode->pairs[0] < data)
				{
					i++;
				}

				newNode->children[i]->insertUnfilled(data);
				root = newNode;
			}
			else
			{
				root->insertUnfilled(data);
			}
		}
	}

	void updateKeyString(keyValuePair<T> data)
	{
		if (root == nullptr)
		{
			cout << "Tree is empty" << endl;
			return;
		}

		root->updateKeyString(data);

	}

	void updateKeyInt(keyValuePair<T> data)
	{
		if (root == nullptr)
		{
			cout << "Tree is empty" << endl;
			return;
		}

		root->updateKeyInt(data);

	}

	void deleteKey(keyValuePair<T> data)
	{
		if (root == nullptr)
		{
			cout << "Tree is empty" << endl;
			return;
		}

		bool repeat = true;

		while (repeat)
		{
			repeat = root->deleteKey(data);
		}

		while (root->noOfKeys == 0)
		{
			BTreeNode<T>* temp = root;

			if (root->leaf)
			{
				root = nullptr;
			}
			else
			{
				root = root->children[0];
			}

			delete temp;
		}

		//clear();
		//createInt(filePaths, 10, this->type);

		return;
	}

	void search(keyValuePair<T> data)
	{
		if (root == nullptr)
		{
			cout << "Key not found" << endl;
		}
		else
		{
			root->search(data);
		}
	}

	void searchRange(int dataLower, int dataUpper)
	{
		int data;
		for (int i = dataLower; i <= dataUpper; i++)
		{
			data = i;
			if (root == nullptr)
			{
				return;
			}
			else
			{
				root->search(data);
			}
		}
	}

	//void create(string* fileNames, int size, int type) // Type 1 for ID, 2 for year etc
	//{
	//	//ifstream file;
	//	//string store, line;
	//	//int counter = 1;
	//	//int commas = 0;

	//	//for (int i = 0; i < size; i++)
	//	//{
	//	//	file.open(fileNames[i]);
	//	//	counter = 1;
	//	//	//cout << "chechking";

	//	//	if (!file)
	//	//	{
	//	//		cout << "File not found!" << endl;
	//	//		return;
	//	//	}

	//	//	while (getline(file, line))
	//	//	{

	//	//		commas = 0;

	//	//		if (counter == 1)
	//	//		{
	//	//			counter++;
	//	//			continue;
	//	//		}

	//	//		for (int i = 0; i < line.size() - 1; i++)
	//	//		{
	//	//			if (line[i] == ',')
	//	//			{
	//	//				commas++;
	//	//				
	//	//				if (commas != type)
	//	//				{
	//	//					store.clear();
	//	//					continue;
	//	//				}
	//	//				else if (commas == type)
	//	//				{
	//	//					break;
	//	//				}
	//	//			}
	//	//			store = store + line[i];
	//	//		}
	//	//		//cout << store << endl;
	//	//		if (store != "")
	//	//		{
	//	//			if (type == 1 || type == 2 || type == 6 || type == 7)
	//	//				Insertion(stoi(store), fileNames[i], counter);
	//	//			else
	//	//				Insertion(store, fileNames[i], counter);
	//	//		}
	//	//		store.clear();
	//	//		counter++;
	//	//	}
	//	//	//cout << counter<<endl;
	//	//	file.close();
	//	//}
	//}

	void createInt(string* fileNames, int size, int type)
	{
		ifstream file;
		string store, line;
		int counter = 1;
		int commas = 0;
		bool readComma = true;
		this->type = type;

		for (int i = 0; i < size; i++)
		{
			file.open(fileNames[i]);
			counter = 1;
			//cout << "chechking";

			if (!file)
			{
				cout << "File not found!" << endl;
				return;
			}

			while (getline(file, line))
			{

				commas = 0;

				if (counter == 1)
				{
					counter++;
					continue;
				}

				for (int i = 0; i < line.size() - 1; i++)
				{
					if (line[i] == '\"' && readComma)
					{
						readComma = false;
						continue;
					}
					else if (line[i] == '\"' && !readComma)
					{
						readComma = true;
						continue;
					}

					if (line[i] == ',' && readComma)
					{
						commas++;

						if (commas != type)
						{
							store.clear();
							continue;
						}
						else if (commas == type)
						{
							break;
						}
					}
					store = store + line[i];
				}
				//cout << store << endl;
				if (store != "")
				{
					Insertion(stoi(store), fileNames[i], counter);
				}
				store.clear();
				counter++;
			}
			//cout << counter<<endl;
			file.close();
		}
		setType(type);
	}

	void createString(string* fileNames, int size, int type)
	{
		ifstream file;
		string store, line;
		int counter = 1;
		int commas = 0;
		bool readComma = true;

		for (int i = 0; i < size; i++)
		{
			file.open(fileNames[i]);
			counter = 1;
			//cout << "chechking";

			if (!file)
			{
				cout << "File not found!" << endl;
				return;
			}

			while (getline(file, line))
			{

				commas = 0;

				if (counter == 1)
				{
					counter++;
					continue;
				}

				for (int i = 0; i < line.size() - 1; i++)
				{
					if (line[i] == '\"' && readComma)
					{
						readComma = false;
						continue;
					}
					else if (line[i] == '\"' && !readComma)
					{
						readComma = true;
						continue;
					}

					if (line[i] == ',' && readComma)
					{
						commas++;

						if (commas != type)
						{
							store.clear();
							continue;
						}
						else if (commas == type)
						{
							break;
						}
					}
					store = store + line[i];
				}
				//cout << store << endl;
				if (store != "")
				{
					Insertion(store, fileNames[i], counter);
				}
				store.clear();
				counter++;
			}
			//cout << counter<<endl;
			file.close();
		}
		setType(type);
	}

};