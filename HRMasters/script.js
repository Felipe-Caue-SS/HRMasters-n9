const nome = document.querySelector('#criar-nome')
const email = document.querySelector('#criar-email')
const endereco = document.querySelector('#criar-endereco')
const codigo = document.querySelector('#criar-codigo')
const salario = document.querySelector('#criar-salario')
const ativo = document.querySelector('#criar-ativo')
const listaFunc = document.querySelector('#funcionarios-list').querySelector('tbody')
const formCrud = document.querySelector('#form-criar')
const logoutButton = document.querySelector('#logout-button')

var linhaSelecionada = null;

formCrud.addEventListener("submit", (e) => {
    let erro = false;
    
    erro = getSubmitFormErrors(nome.value,email.value,endereco.value,codigo.value,salario.value)

    if (erro) {
        e.preventDefault();
    } else {
        handleSubmit();
    }
})

function getSubmitFormErrors(nome, email, endereco, codigo, salario) {
    let erro = false;

    if(nome.value.trim() === '' || email.value.trim() === '' || endereco.value.trim() === '' || codigo.value.trim() === '' || salario.value.trim() === '') {
        erro = true;
    }

    return erro;
};

function handleSubmit() {
    
};

logoutButton.addEventListener('click', () => {
    window.location.href = 'login.html';
})
