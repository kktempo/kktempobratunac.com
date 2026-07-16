// OTVARANJE GALERIJE
function otvoriGaleriju(id) {
    document.getElementById(id).style.display = "block";
    document.body.style.overflow = "hidden";
}

// ZATVARANJE GALERIJE
function zatvoriGaleriju(id) {
    document.getElementById(id).style.display = "none";
    document.body.style.overflow = "auto";
}

// Zatvaranje klikom van slike
document.querySelectorAll(".popup-galerija").forEach(function(galerija){

    galerija.addEventListener("click", function(e){

        if(e.target === galerija){
            galerija.style.display = "none";
            document.body.style.overflow = "auto";
        }

    });

});

function otvoriGaleriju(id){

    document.getElementById(id).style.display="block";

}


function zatvoriGaleriju(id){

    document.getElementById(id).style.display="none";

}