#pragma once
//Remaining libraries and files needed for implementation 
#include "Sha1.hpp"
#include <iostream>

using namespace  std;


char intval(char c1) //converts character into relevent integer value
{
    char c;
    int val;
    if (c1 >= '0' && c1 <= '9') //handling 0-9
    {
        val = int(c1) - '0';

        return c1;
    }

    switch (c1)//handling a-f
    {
    case 'a':
        c = 10;

        break;
    case 'b':
        c = 11;
        break;

    case 'c':
        c = 12;
        break;


    case 'd':
        c = 13;
        break;
    case 'e':
        c = 14;
        break;
    case 'f':
        c = 15;


    }


    return c;
}
char int2char(char c) //converts integer into its ascii character
{
    char c2 = 0;
    if (int(c) >= 0 && int(c) <= 9) //0-9
    {
        c2 = char(int(c)) + '0';

        return c2;
    }

    switch (int(c))//a-f
    {

    case 10:
        c2 = 'a';
        break;

    case 11:
        c2 = 'b';
        break;

    case 12:
        c2 = 'c';
        break;

    case 13:
        c2 = 'd';
        break;

    case 14:
        c2 = 'e';
        break;

    case 15:
        c2 = 'f';
        break;


    }




    return c2;

}


char int2charhigher(unsigned char c) //this function handles the conversion of value of char if it is in higher nibble
{
    unsigned char c2;
    c2 = c >> 4;
    c2 = int2char(c2);

    return c2;
}
string unpackthistostring(string s, int size) //Unpacking packed hexa values into seperate bytes
{
    string s2;
    for (int i = size; i >= 0; i--)
    {

        unsigned char temp;
        temp = s[i];
        temp = temp >> 4;
        temp = temp << 4;
        temp = int2charhigher(temp); //Adding the higher nibble into a seperate char to add to string
        s2 += temp;



        temp = s[i];
        temp = temp << 4;
        temp = temp >> 4;
        temp = int2char(temp); //Adding lower nibble into seperate char to add into string
        s2 += temp;


    }




    return s2;

}
string fixstartingzero(string k) //removes starting zeros in the resultant string
{
    if (k[0] != '0') //edge case
    {
        return k;
    }


    bool allzero = 1;
    string s2;

    int idx = 1;
    while (k[idx] != '\0')
    {
        if (k[idx] == '0')//skipping the zeros at the start
        {
            idx++;
            continue;
        }
        s2 += k[idx];
        allzero = 0; //confirming the whole number isnt just 00000 
        idx++;

    }
    if (allzero) //edge case
    {
        string s = "0";
        return s;
    }

    string result;

    idx = 0;
    while (s2[idx] != '\0') //getting it back in proper order (s2 was reversed)
    {
        result += s2[idx];
        idx++;
    }
    return result;

}

string leastbits(string s, int i, int k2 = 39) //finds the i number of least sig bits from the hexa string provided
{
    if (i >= 160)//max size
    {
        return s;
    }

    if (i <= 0)//handling the minimum
    {
        string s = "0";
        return s;
    }


    string s2;
    int quotient = 0, remainder = 0;
    quotient = i / 8; //number of full bytes that need to be extracted from the hexa string
    remainder = i % 8; //number of bits required to be extracted from hexa string
    int idx = 320 / 8; //320 bits = total, dividing by 8 to find number of bytes
    int shifts = 8 - remainder; //The number of bit shifts to leave only least sig bits required



    for (int i = k2; i >= 0; i--) //converts the string characters from ascii to their value
    {
        if (s[i] >= 'a')
        {
            s2 += intval(s[i]);
            continue;
        }
        s2 += int(s[i]) - '0';

    }


    string s3;
    int i2 = 0;
    for (int i = 0; i < (k2 + 1); i++) //packs pairs of hexa values into higher and lower nibbles
    {
        if ((i % 2))
            continue;

        s3 += int(s2[i]) + (16 * int(s2[i + 1])); //16 * basically left shifts the char by 4 spaces

    }








    string s4;

    for (int i = 0; i < quotient; i++)//this extracts all bytes that are requested
    {
        s4 += s3[i];

    }


    //handling the final part that is less than a byte
    unsigned char final = unsigned int(s3[quotient]) << shifts;

    final = unsigned int(final) >> shifts;
    s4 += final;



    s2.clear();

    //finally getting it back in proper order
    for (int i = 0; i <= quotient; i++)
    {
        s2 += s4[i];

    }

    string k = unpackthistostring(s2, quotient); //converts packed hexa back into string form

    k = fixstartingzero(k);

    //cout << k << endl; //displays the resultant string after extracting i least significant bits



    return k;

}
long long unsigned int convertstringtoint(string s1)//converts hexa string to long long unsigned int
{
    long long unsigned int res = 0;
    int idx = 0;



    while (s1[idx] != '\0') //handling 0-9 
    {
        if (int(s1[idx]) >= '0' && int(s1[idx]) <= '9')
        {
            res += int(s1[idx]) - '0';
            idx++;
            if (s1[idx] != '\0')
                res *= 16;
            continue;
        }
        switch (s1[idx])//handling a-f
        {
        case 'a':
            res += 10;
            break;
        case 'b':
            res += 11;
            break;
        case 'c':
            res += 12;
            break;
        case 'd':
            res += 13;
            break;
        case 'e':
            res += 14;
            break;
        case 'f':
            res += 15;
            break;


        }
        idx++;
        if (s1[idx] != '\0')
            res *= 16;


    }




    return res;



}
