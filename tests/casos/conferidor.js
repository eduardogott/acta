// Conferidor: cada checksum contra um valor bom e um ruim.

function resumoDe(valor) {
  digitar("entrada", valor);
  return txt("resumo");
}

igual("CPF válido", resumoDe("529.982.247-25"), "Confere como CPF.");
igual("CPF de dígito errado", resumoDe("529.982.247-24").indexOf("não confere") > 0, true);
igual("CNPJ válido", resumoDe("11.222.333/0001-81"), "Confere como CNPJ.");
igual("IMEI válido", resumoDe("490154203237518"), "Confere como IMEI.");
igual("IMEI de Luhn errado", resumoDe("490154203237519").indexOf("não confere") > 0, true);
igual("placa Mercosul", resumoDe("ABC1D23"), "Confere como Placa.");
igual("placa antiga", resumoDe("ABC1234"), "Confere como Placa.");
igual("chassi com dígito que fecha", resumoDe("1M8GDM9AXKP042788"), "Confere como Chassi (VIN).");
igual("título de eleitor válido", resumoDe("104725420449").indexOf("Título de eleitor") > 0, true);
igual("chave Pix aleatória", resumoDe("123e4567-e89b-42d3-a456-426614174000"), "Confere como Chave Pix aleatória.");
igual("texto qualquer", resumoDe("banana"), "Não bate com nenhum dos formatos conhecidos.");
igual("um veredito por tipo conhecido", document.querySelectorAll("#lista-conferencia li").length, 8);
