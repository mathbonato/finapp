const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    const customer = customers.find((customer) => customer.cpf === cpf)
    if (!customer) {
        return response.status(400).json({ message: "Customer not found!" });
    }
    request.customer = customer;
    return next()
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

app.post("/accounts", (request, response) => {
    const id = uuidv4();
    const { cpf, name } = request.body;
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
    if (customerAlreadyExists) {
        return response.status(400).json({ message: "Customer already exists!" });
    } else {
        customers.push({ id, cpf, name, statement: [] });
        const customer = customers.find((customer) => customer.cpf === cpf)
        return response.status(201).json(customer);
    }
})

app.put("/accounts", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    const { name } = request.body;
    customer.name = name;
    return response.status(200).json(customer);
})

app.get("/accounts", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    return response.status(201).json(customer);
})

app.delete("/accounts", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    customers.splice(customer, 1)
    return response.status(200).json(customers);
})

app.get("/statements", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; 
    return response.status(201).json(customer.statement);
})

app.post("/deposits", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request; 
    const statementOperation = {
        description,
        amount,
        type: 'credit',
        createdAt: new Date()
    }
    customer.statement.push(statementOperation)
    return response.status(201).json(customer);
})

app.post("/withdrawals", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request; 

    const balance = getBalance(customer.statement) 
    
    if (balance < amount) {
        return response.status(400).json({ message: "Insufficient funds!" });
    } else {
        const statementOperation = {
            amount,
            type: 'debit',
            createdAt: new Date()
        }

        customer.statement.push(statementOperation)
        return response.status(201).json(customer);
    }
})


app.get("/balances", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement) 
    return response.status(201).json(balance);
})


app.listen('3001')
