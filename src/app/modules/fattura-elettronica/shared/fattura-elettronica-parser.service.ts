import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as fe from './fattura-elettronica.model';
import { XmlParserService } from './xml-parser.service';
import { XmlLoaderComponent } from '../editor/xml-loader/xml-loader.component';

@Injectable()
export class FatturaElettronicaParserService {
  private xmlDoc: Document;

  constructor(
    private parser: XmlParserService
  ) { }

  loadXml(xml: string) {
    this.xmlDoc = this.parser.createDocument(xml);
  }

  public getDatiTrasmissione(): fe.DatiTrasmissione {
    const root = '//DatiTrasmissione[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    // //DatiTrasmissione[1]/FormatoTrasmissione/text()

    const progressivoInvio = this.parser.getText(xml, `${root}/ProgressivoInvio`);
    const formatoTrasmissione = this.parser.getText(xml, `${root}/FormatoTrasmissione`);
    const codiceDestinatario = this.parser.getText(xml, `${root}/CodiceDestinatario`);
    const idPaese = this.parser.getText(xml, `${root}/IdTrasmittente/IdPaese`);
    const idCodice = this.parser.getText(xml, `${root}/IdTrasmittente/IdCodice`);
    return {
      progressivoInvio,
      formatoTrasmissione,
      codiceDestinatario,
      idTrasmittente: {
        idPaese,
        idCodice
      },
      contattiTrasmittente: {
        email: this.parser.getText(xml, `${root}/ContattiTrasmittente/Email`),
        telefono: this.parser.getText(xml, `${root}/ContattiTrasmittente/Telefono`)
      },
      pecDestinatario: this.parser.getText(xml, `${root}/PECDestinatario`)
    };
  }

  public getCedentePrestatore(): fe.CedentePrestatore {
    const root = '//CedentePrestatore[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    return {
      datiAnagrafici: this.parseDatiAnagraficiCedente(xml, `${root}/DatiAnagrafici`),
      sede: this.parseIndirizzo(xml, `${root}/Sede`),
      stabileOrganizzazione: this.parseIndirizzo(xml, `${root}/StabileOrganizzazione`),
      iscrizioneREA: this.parseIscrizioneREA(xml, `${root}/IscrizioneREA`),
      contatti: this.getContatti(xml, `${root}/Contatti`),
      riferimentoAmministrazione: this.parser.getText(xml, `${root}/RiferimentoAmministrazione`)
    };
  }
  public getRappresentanteFiscale(): fe.RappresentanteFiscale {
    const root = '//FatturaElettronicaHeader/RappresentanteFiscale[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    return this.parseRappresentanteFiscale(xml, root);
  }

  public getTerzoIntermediario(): fe.RappresentanteFiscale {
    const root = '//FatturaElettronicaHeader/TerzoIntermediarioOSoggettoEmittente[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    return this.parseTerzoIntermediario(xml, root);
  }

  public getCessionarioCommittente(): fe.CessionarioCommittente {
    const root = '//FatturaElettronicaHeader/CessionarioCommittente[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    return this.parseCessionarioCommittente(xml, root);
  }

  public getSoggettoEmittente(): string {
    const root = '//FatturaElettronicaHeader/SoggettoEmittente[1]';
    const xml = this.xmlDoc;
    const rootExists = this.parser.hasNode(xml, root);
    if (!rootExists) {
      return null;
    }

    return this.parser.getText(xml, root);
  }

  private parseCessionarioCommittente(xml: XMLDocument, root: string): fe.CessionarioCommittente {
    return {
      datiAnagrafici: this.parseDatiAnagrafici(xml, `${root}/DatiAnagrafici`),
      sede: this.parseIndirizzo(xml, `${root}/Sede`),
      stabileOrganizzazione: this.parseIndirizzo(xml, `${root}/StabileOrganizzazione`),
      rappresentanteFiscale: this.parseRappresentanteFiscale(xml, `${root}/RappresentanteFiscale`)
    } as fe.CessionarioCommittente;
  }
  private parseRappresentanteFiscale(xml: XMLDocument, root: string): fe.RappresentanteFiscale {
    return {
      datiAnagrafici: this.parseDatiAnagrafici(xml, `${root}/DatiAnagrafici`)
    } as fe.RappresentanteFiscale;
  }

  private parseTerzoIntermediario(xml: XMLDocument, root: string): fe.TerzoIntermediario {
    return {
      datiAnagrafici: this.parseDatiAnagrafici(xml, `${root}/DatiAnagrafici`)
    } as fe.TerzoIntermediario;
  }

  private parseIndirizzo(xml: XMLDocument, root: string): fe.Indirizzo {
    let indirizzo: fe.Indirizzo;
    if (this.parser.hasNode(xml, root)) {
      indirizzo = {};
      indirizzo.indirizzo = this.parser.getText(xml, `${root}/Indirizzo`);
      indirizzo.numeroCivico = this.parser.getText(xml, `${root}/NumeroCivico`);
      indirizzo.cap = this.parser.getText(xml, `${root}/CAP`);
      indirizzo.comune = this.parser.getText(xml, `${root}/Comune`);
      indirizzo.provincia = this.parser.getText(xml, `${root}/Provincia`);
      indirizzo.nazione = this.parser.getText(xml, `${root}/Nazione`);
    }
    return indirizzo;
  }

  private parseDatiAnagrafici(xml: XMLDocument, root: string): fe.DatiAnagrafici {
    let datiAnagrafici: fe.DatiAnagrafici;
    if (this.parser.hasNode(xml, root)) {
      datiAnagrafici = {};
      datiAnagrafici.idFiscaleIVA = this.parseIdFiscaleIva(xml, `${root}/IdFiscaleIVA`);
      datiAnagrafici.codiceFiscale = this.parser.getText(xml, `${root}/CodiceFiscale`);
      datiAnagrafici.anagrafica = this.parseAnagrafica(xml, `${root}/Anagrafica`);
    }
    return datiAnagrafici;
  }
  private parseDatiAnagraficiCedente(xml: XMLDocument, root: string): fe.DatiAnagraficiCedente {
    const datiAnagrafici: fe.DatiAnagraficiCedente = this.parseDatiAnagrafici(xml, root);
    if (!_.isNil(datiAnagrafici)) {
      datiAnagrafici.alboProfessionale = this.parser.getText(xml, `${root}/AlboProfessionale`);
      datiAnagrafici.provinciaAlbo = this.parser.getText(xml, `${root}/ProvinciaAlbo`);
      datiAnagrafici.numeroIscrizioneAlbo = this.parser.getText(xml, `${root}/NumeroIscrizioneAlbo`);
      datiAnagrafici.dataIscrizioneAlbo = this.parser.getDate(xml, `${root}/DataIscrizioneAlbo`);
      datiAnagrafici.regimeFiscale = this.parser.getText(xml, `${root}/RegimeFiscale`);
    }
    return datiAnagrafici;
  }

  private parseAnagrafica(xml: XMLDocument, root: string): fe.Anagrafica {
    let anagrafica: fe.Anagrafica;
    if (this.parser.hasNode(xml, root)) {
      anagrafica = {};
      anagrafica.denominazione = this.parser.getText(xml, `${root}/Denominazione`);
      anagrafica.nome = this.parser.getText(xml, `${root}/Nome`);
      anagrafica.cognome = this.parser.getText(xml, `${root}/Cognome`);
      anagrafica.titolo = this.parser.getText(xml, `${root}/Titolo`);
      anagrafica.codEORI = this.parser.getText(xml, `${root}/CodEORI`);
    }
    return anagrafica;
  }

  private parseIdFiscaleIva(xml: XMLDocument, root: string): fe.IdFiscaleIVA {
    let idFiscaleIVA: fe.IdFiscaleIVA;
    if (this.parser.hasNode(xml, root)) {
      const idPaese = this.parser.getText(xml, `${root}/IdPaese`);
      const idCodice = this.parser.getText(xml, `${root}/IdCodice`);
      idFiscaleIVA = { idPaese, idCodice };
    }
    return idFiscaleIVA;
  }

  private parseIscrizioneREA(xml: XMLDocument, root: string): fe.IscrizioneREA {
    let iscrizioneREA: fe.IscrizioneREA;
    if (this.parser.hasNode(xml, root)) {
      iscrizioneREA = {};
      iscrizioneREA.ufficio = this.parser.getText(xml, `${root}/Ufficio`);
      iscrizioneREA.numeroREA = this.parser.getText(xml, `${root}/NumeroREA`);
      iscrizioneREA.capitaleSociale = this.parser.getText(xml, `${root}/CapitaleSociale`);
      iscrizioneREA.socioUnico = this.parser.getText(xml, `${root}/SocioUnico`);
      iscrizioneREA.statoLiquidazione = this.parser.getText(xml, `${root}/StatoLiquidazione`);
    }
    return iscrizioneREA;
  }

  private getContatti(xml: XMLDocument, root: string): fe.Contatti {
    let contatti: fe.Contatti;
    if (this.parser.hasNode(xml, root)) {
      contatti = {};
      contatti.email = this.parser.getText(xml, `${root}/Email`);
      contatti.telefono = this.parser.getText(xml, `${root}/Telefono`);
      contatti.fax = this.parser.getText(xml, `${root}/Fax`);
    }
    return contatti;
  }
}
