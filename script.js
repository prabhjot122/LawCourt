
class Calculator{    
    constructor(a,b){
        this.a=a;
        this.b=b;
    }
    Add(){
        console.log("Adding the numbers");
        console.log(a+b);
    }
    Subtract(){
        console.log("Subtracting numbers");
        console.log(a-b);
    }
    Multiply(){
        console.log("Multiplying numbers");
        console.log(a*b);
    }
    Dividing(){
        console.log("Dividing numbers");
        console.log(a/b);
    }
    ShowMenu(){
        let c = ["ADD","SUBTRACT","MULTIPLY","DIVIDE"];
        console.log("===CALCULATOR===");
        for(let i=0;i<c.length;i++){
            console.log(c[i]);
        }
    }
}
let number1 = prompt("enter your first number");
let number2 = prompt("enter your second number");
let object =new Calculator(number1,number2);

