const form = document.querySelectorAll('.form');
const nomeInput = document.querySelector('#nome-input');
const emailInput = document.querySelector('#email-input');
const senhaInput = document.querySelector('#senha-input');
const repetirSenhaInput = document.querySelector('#repetir-senha-input');

form.addEventListener('submit', (e) => {

    let erro = false;

    if(repetirSenhaInput){
        erro = getCadastroFormErrors(nomeInput.value, emailInput.value, senhaInput.value, repetirSenhaInput.value);
    } else {
        erro = getLoginFormErrors(emailInput.value, senhaInput.value);
    }

    if(erro){
        e.preventDefault();
    }
});

function getCadastroFormErrors(nome, email, senha, repetirSenha) {
    let erro = false;

    if(nome === '' || nome === null){
        erro = true;
    }
    if(email === '' || email === null){
        erro = true;
    }
    if(senha === '' || senha === null){
        erro = true;
    }
    if(repetirSenha === '' || repetirSenha === null){
        erro = true;
    }
    if(senha !== repetirSenha){
        erro = true;
    }
    return erro;
};

function getLoginFormErrors(email, senha) {
    let erro = false;

    if(email === '' || email === null){
        erro = true;
    }
    if(senha === '' || senha === null){
        erro = true;
    }
    return erro;
};