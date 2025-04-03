const { Sequelize, DataTypes } = require('sequelize');
const MYSQL_IP = "localhost";
const MYSQL_LOGIN = "root";
const MYSQL_PASSWORD = "root";
const DATABASE = "sakila";
const sequelize = new Sequelize(DATABASE, MYSQL_LOGIN, MYSQL_PASSWORD, { host: MYSQL_IP, dialect: "mysql" });


const Address = sequelize.define("Address", {
    address_id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    address: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    address2: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    district: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    city_id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        references: {
            model: "city", // Nome da tabela referenciada
            key: "city_id"
        }
    },
    postal_code: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    location: {
        type: DataTypes.GEOMETRY("POINT"),
        allowNull: true
    },
    last_update: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
}, {
    tableName: "address",
    timestamps: false
});

const City = sequelize.define('City', {
    city_id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,  // Chave primária com incremento automático
        primaryKey: true      // Definindo como chave primária
    },
    city: {
        type: DataTypes.STRING(50),
        allowNull: false,  // A cidade não pode ser nula
    },
    country_id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,  // O país não pode ser nulo
        references: {
            model: 'country',  // Nome da tabela de referência
            key: 'country_id'  // A coluna que é a chave primária na tabela "country"
        }
    },
    last_update: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),  // Definindo o valor padrão como o timestamp atual
    }
}, {
    tableName: 'city',  // Nome da tabela no banco de dados
    timestamps: false,  // Desativando a criação automática das colunas "createdAt" e "updatedAt"
});

const Country = sequelize.define('Country', {
    country_id: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,  // Identificador único com incremento automático
        primaryKey: true      // Chave primária
    },
    country: {
        type: DataTypes.STRING(50),
        allowNull: false,  // O nome do país não pode ser nulo
    },
    last_update: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),  // Definindo o valor padrão para a data e hora atuais
    }
}, {
    tableName: 'country',  // Nome da tabela no banco de dados
    timestamps: false      // Desativa os campos automáticos createdAt e updatedAt
});

// 1. Cada cidade pertence a um país (Cidade -> País)
City.belongsTo(Country, {
    foreignKey: 'country_id', // A coluna 'country_id' da tabela 'City' faz referência à tabela 'Country'
});

// 2. Um país pode ter muitas cidades (País -> Cidade)
Country.hasMany(City, {
    foreignKey: 'country_id', // O 'country_id' em 'City' referencia o 'country_id' em 'Country'
});

// 3. Cada endereço pertence a uma cidade (Endereço -> Cidade)
Address.belongsTo(City, {
    foreignKey: 'city_id', // A coluna 'city_id' em 'Address' faz referência à tabela 'City'
});

// 4. Uma cidade pode ter muitos endereços (Cidade -> Endereço)
City.hasMany(Address, {
    foreignKey: 'city_id', // O 'city_id' em 'Address' referencia o 'city_id' em 'City'
});

async function startApplication() {
    try {
        await sequelize.sync({ force: false });
        console.log('Modelos sincronizados com sucesso!');
        // Show menu only after successful sync
        mainMenuLoop();
    } catch (error) {
        console.error('Erro ao sincronizar os modelos:', error);
    }
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\nEscolha uma opção:');
    console.log('1. Exibir Países');
    console.log('2. Exibir Cidades');
    console.log('3. Exibir Endereços');
    console.log('4. Cadastrar Novo País');
    console.log('5. Cadastrar Nova Cidade');
    console.log('6. Cadastrar Novo Endereço');
    console.log('7. Sair');
}

function mainMenuLoop() {
    showMenu();
    rl.question('Digite o número da opção desejada: ', async (choice) => {
        switch (choice) {
            case '1':
                await listCountries();
                mainMenuLoop();
                break;
            case '2':
                await listCities();
                mainMenuLoop();
                break;
            case '3':
                await listAddresses();
                mainMenuLoop();
                break;
            case '4':
                await createCountry();
                mainMenuLoop();
                break;
            case '5':
                await createCity();
                mainMenuLoop();
                break;
            case '6':
                await createAddress();
                mainMenuLoop();
                break;
            case '7':
                console.log('Saindo...');
                rl.close();
                break;
            default:
                console.log('Opção inválida! Tente novamente.');
                mainMenuLoop();
                break;
        }
    });
}

sequelize.sync({ force: false }).then(() => {
    console.log('Modelos sincronizados com sucesso!');
})
    .catch((error) => {
        console.error('Erro ao sincronizar os modelos:', error);
    });

async function listAddresses() {
    try {
        const addresses = await Address.findAll({
            include: [
                {
                    model: City,
                    attributes: ['city_id', 'city', 'country_id', 'last_update'],
                    include: [{
                        model: Country, attributes: ['country_id', 'country', 'last_update'], // Incluindo o país associado à cidade
                    },
                    ],
                },
            ],
        });
        console.log('Addresses with their City and Country:');
        console.log(JSON.stringify(addresses, null, 2));
    } catch (error) {
        console.error('Error fetching addresses with city and country:', error);
    }
}

async function listCities() {
    try {
        const cities = await City.findAll({
            include: {
                model: Country,
                attributes: ['country_id', 'country', 'last_update'], // Especificando os campos de 'Country' para incluir
            },
        });
        console.log('Cities with their Country:');
        console.log(JSON.stringify(cities, null, 2));
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

async function listCountries() {
    try {
        const countries = await Country.findAll({
            // Aqui não estamos incluindo as cidades
            attributes: ['country_id', 'country', 'last_update'], // Selecionando apenas os campos do país
        });


        console.log('Countries:');
        console.log(JSON.stringify(countries, null, 2));
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

// Função para criar um novo país
async function createCountry() {
    return new Promise((resolve) => {
        rl.question('Digite o nome do país: ', async (countryName) => {
            try {
                let country = await Country.findOne({ where: { country: countryName } });
                if (!country) {
                    country = await Country.create({ country: countryName });
                    console.log(`País "${countryName}" criado com sucesso!`);
                } else {
                    console.log(`O país "${countryName}" já existe.`);
                }
                resolve();
            } catch (error) {
                console.error('Erro ao cadastrar país:', error);
                resolve();
            }
        });
    });
}

async function createCity() {
    return new Promise((resolve) => {
        rl.question('Digite o nome da cidade: ', (cityName) => {
            rl.question('Digite o nome do país para associar à cidade: ', async (countryName) => {
                try {
                    let country = await Country.findOne({ where: { country: countryName } });
                    if (!country) {
                        country = await Country.create({ country: countryName });
                        console.log(`País "${countryName}" criado com sucesso!`);
                    }
                   
                    let city = await City.findOne({ where: { city: cityName, country_id: country.country_id } });
                    if (!city) {
                        city = await City.create({
                            city: cityName,
                            country_id: country.country_id
                        });
                        console.log(`Cidade "${cityName}" criada com sucesso!`);
                    } else {
                        console.log(`A cidade "${cityName}" já existe no país "${countryName}".`);
                    }
                    resolve();
                } catch (error) {
                    console.error('Erro ao cadastrar cidade:', error);
                    resolve();
                }
            });
        });
    });
}

async function createAddress() {
    return new Promise((resolve) => {
        rl.question('Digite o endereço (linha 1): ', (addressLine1) => {
            rl.question('Digite o endereço (linha 2): ', (addressLine2) => {
                rl.question('Digite o bairro: ', (district) => {
                    rl.question('Digite o número de telefone: ', (phone) => {
                        rl.question('Digite o código postal: ', (postalCode) => {
                            rl.question('Digite o nome da cidade para associar ao endereço: ', async (cityName) => {
                                try {
                                    let city = await City.findOne({ where: { city: cityName } });
                                    if (!city) {
                                        console.log(`A cidade "${cityName}" não existe. Criando nova cidade...`);
                                        rl.question('Digite o nome do país para a cidade: ', async (countryName) => {
                                            try {
                                                let country = await Country.findOne({ where: { country: countryName } });
                                                if (!country) {
                                                    country = await Country.create({ country: countryName });
                                                    console.log(`País "${countryName}" criado com sucesso!`);
                                                }
                                               
                                                city = await City.create({
                                                    city: cityName,
                                                    country_id: country.country_id
                                                });
                                                console.log(`Cidade "${cityName}" criada com sucesso!`);
                                               
                                                await Address.create({
                                                    address: addressLine1,
                                                    address2: addressLine2,
                                                    district: district,
                                                    city_id: city.city_id,
                                                    phone: phone,
                                                    postal_code: postalCode,
                                                    location: sequelize.fn('ST_GeomFromText', `POINT(128.0449753 46.9804391)`)
                                                });
                                                console.log(`Endereço "${addressLine1}" cadastrado com sucesso!`);
                                                resolve();
                                            } catch (error) {
                                                console.error('Erro ao cadastrar cidade ou endereço:', error);
                                                resolve();
                                            }
                                        });
                                    } else {
                                        await Address.create({
                                            address: addressLine1,
                                            address2: addressLine2,
                                            district: district,
                                            city_id: city.city_id,
                                            phone: phone,
                                            postal_code: postalCode,
                                            location: sequelize.fn('ST_GeomFromText', `POINT(37.7749 -122.4194)`)
                                        });
                                        console.log(`Endereço "${addressLine1}" cadastrado com sucesso!`);
                                        resolve();
                                    }
                                } catch (error) {
                                    console.error('Erro ao cadastrar endereço:', error);
                                    resolve();
                                }
                            });
                        });
                    });
                });
            });
        });
    });
}

// Inicializando o menu
startApplication();